from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from services import resource_service
from services.auth_dependency import get_current_user

router = APIRouter(prefix="/resources", tags=["resources"])


class CreateResourceRequest(BaseModel):
    name: str
    category: str
    unit: str


class AddStockRequest(BaseModel):
    resource_id: str
    quantity: float
    notes: Optional[str] = None


class UseStockRequest(BaseModel):
    resource_id: str
    quantity: float
    issue_id: str
    notes: Optional[str] = None


@router.get("/")
async def list_resources(current_user: dict = Depends(get_current_user)):
    return resource_service.list_resources(current_user)


@router.post("/")
async def create_resource(req: CreateResourceRequest, current_user: dict = Depends(get_current_user)):
    return resource_service.create_resource(current_user, req.name, req.category, req.unit)


@router.post("/add")
async def add_stock(req: AddStockRequest, current_user: dict = Depends(get_current_user)):
    return resource_service.add_stock(current_user, req.resource_id, req.quantity, req.notes)


@router.post("/use")
async def use_stock(req: UseStockRequest, current_user: dict = Depends(get_current_user)):
    return resource_service.use_stock(current_user, req.resource_id, req.quantity, req.issue_id, req.notes)


@router.get("/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    return resource_service.get_analytics(current_user)
