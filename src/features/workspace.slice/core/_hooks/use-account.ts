import { useContext } from 'react';

import { AccountContext } from '@/shared/app-providers/account-context';

export const useAccount = () => {
    const context = useContext(AccountContext);
    if (!context) {
        throw new Error('useAccount must be used within an AccountProvider');
    }
    return context;
};
