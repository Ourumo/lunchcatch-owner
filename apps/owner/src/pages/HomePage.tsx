import { FirstVisitTutorial } from '@owner/features/home/FirstVisitTutorial';
import { HomeDashboard } from '@owner/features/home/HomeDashboard';

const HomePage = () => {
  return (
    <>
      <HomeDashboard />
      <FirstVisitTutorial />
    </>
  );
};

export default HomePage;
