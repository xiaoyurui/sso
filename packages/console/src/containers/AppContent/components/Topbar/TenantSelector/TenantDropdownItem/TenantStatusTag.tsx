import { conditional } from '@silverhand/essentials';
import { useMemo } from 'react';

import DynamicT from '@/ds-components/DynamicT';
import Tag from '@/ds-components/Tag';
import useInvoices from '@/hooks/use-invoices';
import useSubscriptionUsage from '@/hooks/use-subscription-usage';
import { type SubscriptionPlan } from '@/types/subscriptions';
import { getLatestUnpaidInvoice } from '@/utils/subscription';

type Props = {
  tenantId: string;
  tenantPlan: SubscriptionPlan;
  className?: string;
};

function TenantStatusTag({ tenantId, tenantPlan, className }: Props) {
  const { data: usage, error: fetchUsageError } = useSubscriptionUsage(tenantId);
  const { data: invoices, error: fetchInvoiceError } = useInvoices(tenantId);

  const isLoadingUsage = !usage && !fetchUsageError;
  const isLoadingInvoice = !invoices && !fetchInvoiceError;

  const latestUnpaidInvoice = useMemo(
    () => conditional(invoices && getLatestUnpaidInvoice(invoices)),
    [invoices]
  );

  if (isLoadingUsage || isLoadingInvoice) {
    return null;
  }

  /**
   * Tenant status priority:
   * 1. suspend (WIP) @xiaoyijun
   * 2. overdue
   * 3. mau exceeded
   */

  if (invoices && latestUnpaidInvoice) {
    return (
      <Tag className={className}>
        <DynamicT forKey="tenants.status.overdue" />
      </Tag>
    );
  }

  if (usage) {
    const { activeUsers } = usage;

    const {
      quota: { mauLimit },
    } = tenantPlan;

    const isMauExceeded = mauLimit !== null && activeUsers >= mauLimit;

    if (isMauExceeded) {
      return (
        <Tag className={className}>
          <DynamicT forKey="tenants.status.mau_exceeded" />
        </Tag>
      );
    }
  }

  return null;
}

export default TenantStatusTag;
