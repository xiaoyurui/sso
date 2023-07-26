import classNames from 'classnames';

import Tick from '@/assets/icons/tick.svg';
import { type TenantResponse } from '@/cloud/types/router';
import PlanName from '@/components/PlanName';
import { DropdownItem } from '@/ds-components/Dropdown';
import useSubscriptionPlans from '@/hooks/use-subscription-plans';

import TenantEnvTag from '../TenantEnvTag';

import Skeleton from './Skeleton';
import TenantStatusTag from './TenantStatusTag';
import * as styles from './index.module.scss';

type Props = {
  tenantData: TenantResponse;
  isSelected: boolean;
  onClick: () => void;
};

function TenantDropdownItem({ tenantData, isSelected, onClick }: Props) {
  const { id, name, tag, planId } = tenantData;
  const { data: plans } = useSubscriptionPlans();
  const tenantPlan = plans?.find((plan) => plan.id === planId);

  return (
    <DropdownItem className={styles.item} onClick={onClick}>
      <div className={styles.info}>
        <div className={styles.meta}>
          <div className={styles.name}>{name}</div>
          <TenantEnvTag tag={tag} />
          {tenantPlan && (
            <TenantStatusTag tenantId={id} className={styles.statusTag} tenantPlan={tenantPlan} />
          )}
        </div>
        <div className={styles.planName}>
          {tenantPlan ? <PlanName name={tenantPlan.name} /> : <Skeleton />}
        </div>
      </div>
      <Tick className={classNames(styles.checkIcon, isSelected && styles.visible)} />
    </DropdownItem>
  );
}

export default TenantDropdownItem;
