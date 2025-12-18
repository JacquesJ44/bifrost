from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Read-only engine for Heimdall
heimdall_engine = create_engine(
    os.getenv('HEIMDALL_RO_DB_URI'),
    pool_pre_ping=True,
    pool_recycle=280
)

HeimdallSession = sessionmaker(bind=heimdall_engine)
