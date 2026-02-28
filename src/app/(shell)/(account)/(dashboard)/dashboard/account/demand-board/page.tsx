// Legacy demand-board route is intentionally consolidated into the account schedule entrypoint.
import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/constants/routes';

export default function DemandBoardPage() {
  redirect(ROUTES.ACCOUNT_SCHEDULE);
}
