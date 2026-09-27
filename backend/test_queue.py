import asyncio
from app.database import db_manager
from app.routers.bidders_router import get_verification_queue
from app.models.user import UserBase

async def test():
    await db_manager.connect()
    dummy_user = UserBase(username='officer_cpcl', email='officer.cpcl@gov.in', role='PROCUREMENT_OFFICER', full_name='Rajesh Kumar', department='CPCL')
    q = await get_verification_queue(current_user=dummy_user)
    print(f'QUEUE ITEMS RETURNED: {len(q)}')
    for item in q[:8]:
        print(f"  [{item['priority']}] {item['bidder_id']} - {item['company_name'][:25]}: {item['issue'][:45]} (Score: {item['compliance_score']})")

if __name__ == '__main__':
    asyncio.run(test())
