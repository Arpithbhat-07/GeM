import json
import os
import asyncio
from datetime import datetime, date
from typing import Any, Dict, List, Optional
from bson import ObjectId
import motor.motor_asyncio
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import settings

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, (datetime, date)):
            return o.isoformat()
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, set):
            return list(o)
        return super().default(o)

class FallbackCollection:
    """High-performance in-memory and JSON-backed collection mimicking Motor Collection API."""
    def __init__(self, name: str, db_ref: 'FallbackDatabase'):
        self.name = name
        self.db_ref = db_ref

    def _matches(self, doc: dict, query: dict) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, cond) for cond in v):
                    return False
                continue
            if k == "$and" and isinstance(v, list):
                if not all(self._matches(doc, cond) for cond in v):
                    return False
                continue
            
            # Handle nested or operators like {"$in": [...]}
            doc_val = doc.get(k)
            if isinstance(v, dict):
                matched = True
                for op, op_val in v.items():
                    if op == "$in":
                        if isinstance(doc_val, (list, tuple, set)):
                            if not any(x in op_val for x in doc_val):
                                matched = False
                        elif doc_val not in op_val:
                            matched = False
                    elif op == "$nin":
                        if isinstance(doc_val, (list, tuple, set)):
                            if any(x in op_val for x in doc_val):
                                matched = False
                        elif doc_val in op_val:
                            matched = False
                    elif op == "$eq":
                        if isinstance(doc_val, (list, tuple, set)) and not isinstance(op_val, (list, tuple, set)):
                            if op_val not in doc_val:
                                matched = False
                        elif doc_val != op_val:
                            matched = False
                    elif op == "$ne":
                        if isinstance(doc_val, (list, tuple, set)) and not isinstance(op_val, (list, tuple, set)):
                            if op_val in doc_val:
                                matched = False
                        elif doc_val == op_val:
                            matched = False
                    elif op == "$gt":
                        if doc_val is None or doc_val <= op_val:
                            matched = False
                    elif op == "$gte":
                        if doc_val is None or doc_val < op_val:
                            matched = False
                    elif op == "$lt":
                        if doc_val is None or doc_val >= op_val:
                            matched = False
                    elif op == "$lte":
                        if doc_val is None or doc_val > op_val:
                            matched = False
                    elif op == "$regex":
                        import re
                        pattern = op_val
                        if isinstance(doc_val, (list, tuple, set)):
                            if not any(x and re.search(pattern, str(x), re.IGNORECASE) for x in doc_val):
                                matched = False
                        elif not doc_val or not re.search(pattern, str(doc_val), re.IGNORECASE):
                            matched = False
                if not matched:
                    return False
            else:
                if isinstance(doc_val, (list, tuple, set)) and not isinstance(v, (list, tuple, set)):
                    if v not in doc_val:
                        return False
                elif doc_val != v:
                    return False
        return True

    async def find_one(self, query: Optional[dict] = None) -> Optional[dict]:
        query = query or {}
        items = self.db_ref._data.get(self.name, [])
        for item in items:
            if self._matches(item, query):
                # Return deep copy to prevent mutation bugs
                return json.loads(json.dumps(item, cls=JSONEncoder))
        return None

    def find(self, query: Optional[dict] = None):
        query = query or {}
        items = self.db_ref._data.get(self.name, [])
        matched = [
            json.loads(json.dumps(item, cls=JSONEncoder))
            for item in items
            if self._matches(item, query)
        ]
        return FallbackCursor(matched)

    async def insert_one(self, document: dict):
        if self.name not in self.db_ref._data:
            self.db_ref._data[self.name] = []
        doc_copy = json.loads(json.dumps(document, cls=JSONEncoder))
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(ObjectId())
        self.db_ref._data[self.name].append(doc_copy)
        self.db_ref.persist()
        class InsertResult:
            def __init__(self, id_val):
                self.inserted_id = id_val
        return InsertResult(doc_copy["_id"])

    async def insert_many(self, documents: list):
        if self.name not in self.db_ref._data:
            self.db_ref._data[self.name] = []
        ids = []
        for doc in documents:
            doc_copy = json.loads(json.dumps(doc, cls=JSONEncoder))
            if "_id" not in doc_copy:
                doc_copy["_id"] = str(ObjectId())
            self.db_ref._data[self.name].append(doc_copy)
            ids.append(doc_copy["_id"])
        self.db_ref.persist()
        class InsertManyResult:
            def __init__(self, id_vals):
                self.inserted_ids = id_vals
        return InsertManyResult(ids)

    async def update_one(self, query: dict, update: dict, upsert: bool = False):
        items = self.db_ref._data.get(self.name, [])
        matched_idx = -1
        for idx, item in enumerate(items):
            if self._matches(item, query):
                matched_idx = idx
                break
        
        modified_count = 0
        if matched_idx != -1:
            doc = items[matched_idx]
            if "$set" in update:
                doc.update(update["$set"])
            else:
                doc.update(update)
            modified_count = 1
        elif upsert:
            new_doc = dict(query)
            if "$set" in update:
                new_doc.update(update["$set"])
            else:
                new_doc.update(update)
            if "_id" not in new_doc:
                new_doc["_id"] = str(ObjectId())
            if self.name not in self.db_ref._data:
                self.db_ref._data[self.name] = []
            self.db_ref._data[self.name].append(new_doc)
            modified_count = 1

        self.db_ref.persist()
        class UpdateResult:
            def __init__(self, count):
                self.modified_count = count
        return UpdateResult(modified_count)

    async def delete_one(self, query: dict):
        items = self.db_ref._data.get(self.name, [])
        for idx, item in enumerate(items):
            if self._matches(item, query):
                del items[idx]
                self.db_ref.persist()
                class DelResult:
                    def __init__(self):
                        self.deleted_count = 1
                return DelResult()
        class DelResult0:
            def __init__(self):
                self.deleted_count = 0
        return DelResult0()

    async def delete_many(self, query: dict):
        items = self.db_ref._data.get(self.name, [])
        survivors = [item for item in items if not self._matches(item, query)]
        del_count = len(items) - len(survivors)
        self.db_ref._data[self.name] = survivors
        self.db_ref.persist()
        class DelResult:
            def __init__(self, count):
                self.deleted_count = count
        return DelResult(del_count)

    async def count_documents(self, query: Optional[dict] = None) -> int:
        query = query or {}
        items = self.db_ref._data.get(self.name, [])
        return sum(1 for item in items if self._matches(item, query))

    async def drop(self):
        self.db_ref._data[self.name] = []
        self.db_ref.persist()

class FallbackCursor:
    def __init__(self, items: list):
        self._items = items

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            for key, direct in reversed(key_or_list):
                self._items.sort(key=lambda x: x.get(key, 0) or 0, reverse=(direct == -1))
        else:
            self._items.sort(key=lambda x: x.get(key_or_list, 0) or 0, reverse=(direction == -1))
        return self

    def limit(self, count: int):
        self._items = self._items[:count]
        return self

    def skip(self, count: int):
        self._items = self._items[count:]
        return self

    async def to_list(self, length: Optional[int] = None) -> list:
        if length is not None:
            return self._items[:length]
        return self._items

    def __aiter__(self):
        self._iter = iter(self._items)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration

class FallbackDatabase:
    """In-memory database with synchronous JSON persistence."""
    def __init__(self, file_path: str):
        self.file_path = file_path
        self._data: Dict[str, List[dict]] = {}
        self.load()

    def load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
            except Exception as e:
                print(f"[FallbackDB] Error loading file: {e}. Starting fresh.")
                self._data = {}
        else:
            self._data = {}

    def persist(self):
        try:
            temp_path = self.file_path + ".tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, cls=JSONEncoder, indent=2)
            if os.path.exists(self.file_path):
                os.replace(temp_path, self.file_path)
            else:
                os.rename(temp_path, self.file_path)
        except Exception as e:
            print(f"[FallbackDB] Error saving to {self.file_path}: {e}")

    def __getitem__(self, name: str) -> FallbackCollection:
        return FallbackCollection(name, self)

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_connected = False
        self.mode = "uninitialized"

    async def connect(self):
        # 1. Try real MongoDB
        try:
            print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
            client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=1500
            )
            # Ping to confirm
            await client.admin.command('ping')
            self.client = client
            self.db = client[settings.DATABASE_NAME]
            self.is_connected = True
            self.mode = "mongodb"
            print("[Database] Successfully connected to live MongoDB instance.")
            return self.db
        except Exception as e:
            print(f"[Database] Live MongoDB connection unavailable ({e}).")
            print("[Database] Seamlessly engaging Fallback Engine with Persistent JSON storage.")
            fallback_path = os.path.join(settings.DATA_DIR, "gem_sentinel_db.json")
            self.db = FallbackDatabase(fallback_path)
            self.is_connected = True
            self.mode = "fallback_json"
            return self.db

    async def disconnect(self):
        if self.client:
            self.client.close()
            print("[Database] Closed MongoDB client connection.")

db_manager = DatabaseManager()

def get_db():
    return db_manager.db
