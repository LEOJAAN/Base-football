import { useState } from 'react';
import { Onboarding } from './views/Onboarding';
import { TeamSelection, teams } from './views/TeamSelection';
import { Arena } from './views/Arena';
import type { Team } from './views/TeamSelection';

type AppState = 'ONBOARDING' | 'TEAM_SELECTION' | 'ARENA';

function App() {
  const [appState, setAppState] = useState<AppState>('ONBOARDING');
  const [username, setUsername] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  const handleOnboardingComplete = (name: string) => {
    setUsername(name);
    setAppState('TEAM_SELECTION');
  };

  const handleTeamSelect = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setSelectedTeam(team);
      setAppState('ARENA');
    }
  };

  return (
    <div className="app-container">
      {appState === 'ONBOARDING' && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
      
      {appState === 'TEAM_SELECTION' && (
        <TeamSelection onSelectTeam={handleTeamSelect} username={username} />
      )}
      
      {appState === 'ARENA' && selectedTeam && (
        <Arena 
          selectedTeam={selectedTeam} 
          username={username} 
          onRestart={() => setAppState('TEAM_SELECTION')} 
        />
      )}
    </div>
  );
}

export default App;
