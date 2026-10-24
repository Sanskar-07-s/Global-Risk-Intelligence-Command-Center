from fastapi import APIRouter
from backend.app.schemas.event import ScenarioSimulationRequest, ScenarioSimulationResult
from backend.app.services.scenarios.engine import ScenarioEngine

router = APIRouter(prefix="/scenarios", tags=["Scenario Laboratory"])

@router.post("/simulate", response_model=ScenarioSimulationResult)
def simulate_scenario(req: ScenarioSimulationRequest):
    return ScenarioEngine.run_simulation(req)
