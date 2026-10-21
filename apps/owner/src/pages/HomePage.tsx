import { HomeDashboard } from '@owner/features/home/HomeDashboard';
import { FirstVisitTutorial } from '@owner/features/tutorial/FirstVisitTutorial';

const HomePage = () => {
  return (
    <>
      <HomeDashboard />
      <FirstVisitTutorial />
    </>
  );
};

export default HomePage;
