// Legacy org-schedule route is intentionally consolidated into the account schedule entrypoint.
import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/constants/routes';

export default function OrgSchedulePage() {
  redirect(ROUTES.ACCOUNT_SCHEDULE);
}
