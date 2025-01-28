from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, index=True)
    position = Column(String)
    department = Column(String)
    company_id = Column(Integer, ForeignKey("companies.id"))
    hire_date = Column(DateTime)

    company = relationship("Company", back_populates="employees")
    user = relationship("User", back_populates="employee", uselist=False)

