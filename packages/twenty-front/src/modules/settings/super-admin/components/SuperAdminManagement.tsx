import styled from '@emotion/styled';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { SuperAdminMemberPickerDropdown } from '@/settings/super-admin/components/SuperAdminMemberPickerDropdown';
import { useAddSuperAdmin } from '@/settings/super-admin/hooks/useAddSuperAdmin';
import { useCheckIsPrimarySuperAdmin } from '@/settings/super-admin/hooks/useCheckIsSuperAdmin';
import { useRemoveSuperAdmin } from '@/settings/super-admin/hooks/useRemoveSuperAdmin';
import {
  useSuperAdmins,
  type SuperAdmin,
} from '@/settings/super-admin/hooks/useSuperAdmins';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { Table } from '@/ui/layout/table/components/Table';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { H2Title, IconPlus, IconShield, IconTrash } from 'twenty-ui/display';
import { Button, IconButton } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';

const ADD_SUPER_ADMIN_MODAL_ID = 'add-super-admin-modal';
const REMOVE_SUPER_ADMIN_MODAL_ID = 'remove-super-admin-modal';
const ADD_SUPER_ADMIN_DROPDOWN_ID = 'add-super-admin-dropdown';

const StyledAddContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-block: ${({ theme }) => theme.spacing(2)};
`;

const StyledButtonContainer = styled.div`
  align-items: center;
  display: flex;
  margin-left: ${({ theme }) => theme.spacing(3)};
`;

const StyledEmailCell = styled.div`
  align-items: center;
  display: flex;
`;

const StyledNoMembers = styled(TableCell)`
  color: ${({ theme }) => theme.font.color.tertiary};
`;

const StyledPrimaryBadge = styled.span`
  align-items: center;
  background-color: ${({ theme }) => theme.color.blue10};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  color: ${({ theme }) => theme.color.blue};
  display: inline-flex;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  gap: ${({ theme }) => theme.spacing(1)};
  margin-left: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(0.5)}
    ${({ theme }) => theme.spacing(1)};
`;

const StyledTable = styled(Table)`
  margin-top: ${({ theme }) => theme.spacing(4)};
`;

const StyledTableRows = styled.div`
  padding-bottom: ${({ theme }) => theme.spacing(2)};
  padding-top: ${({ theme }) => theme.spacing(2)};
`;

export const SuperAdminManagement = () => {
  const { t } = useLingui();
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const { openModal } = useModal();
  const { closeDropdown } = useCloseDropdown();

  const {
    superAdmins,
    loading: loadingSuperAdmins,
    refetch,
  } = useSuperAdmins();
  const { isPrimarySuperAdmin, loading: loadingPrimary } =
    useCheckIsPrimarySuperAdmin();
  const { addSuperAdmin, loading: addingAdmin } = useAddSuperAdmin();
  const { removeSuperAdmin, loading: removingAdmin } = useRemoveSuperAdmin();

  const [selectedMember, setSelectedMember] = useState<{
    email: string;
    name: string;
  } | null>(null);
  const [superAdminToRemove, setSuperAdminToRemove] =
    useState<SuperAdmin | null>(null);

  const handleMemberSelect = (email: string, name: string) => {
    setSelectedMember({ email, name });
    closeDropdown(ADD_SUPER_ADMIN_DROPDOWN_ID);
    openModal(ADD_SUPER_ADMIN_MODAL_ID);
  };

  const handleAddSuperAdmin = async () => {
    if (!selectedMember) return;

    try {
      await addSuperAdmin(selectedMember.email.toLowerCase());
      enqueueSuccessSnackBar({ message: t`Super Admin added successfully` });
      setSelectedMember(null);
      await refetch();
    } catch (error: unknown) {
      const apolloError = error as {
        graphQLErrors?: Array<{ message: string }>;
        message?: string;
      };
      const message =
        apolloError?.graphQLErrors?.[0]?.message ||
        apolloError?.message ||
        t`Failed to add Super Admin`;
      enqueueErrorSnackBar({ message });
    }
  };

  const handleRemoveSuperAdmin = async () => {
    if (!superAdminToRemove) return;

    try {
      await removeSuperAdmin(superAdminToRemove.userEmail);
      enqueueSuccessSnackBar({ message: t`Super Admin removed successfully` });
      setSuperAdminToRemove(null);
      await refetch();
    } catch (error: unknown) {
      const apolloError = error as {
        graphQLErrors?: Array<{ message: string }>;
        message?: string;
      };
      const message =
        apolloError?.graphQLErrors?.[0]?.message ||
        apolloError?.message ||
        t`Failed to remove Super Admin`;
      enqueueErrorSnackBar({ message });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isLoading = loadingSuperAdmins || loadingPrimary;

  // Get list of emails that are already super admins (to exclude from picker)
  const excludedEmails = superAdmins.map((admin) =>
    admin.userEmail.toLowerCase(),
  );

  const selectedMemberEmail = selectedMember?.email ?? '';
  const selectedMemberName = selectedMember?.name ?? '';
  const superAdminToRemoveEmail = superAdminToRemove?.userEmail ?? '';

  return (
    <>
      <Section>
        <H2Title
          title={t`Super Admin Management`}
          description={
            isPrimarySuperAdmin
              ? t`Manage users who can access Advanced Settings.`
              : t`View users who can access Advanced Settings. Only the Primary Super Admin can make changes.`
          }
        />

        <StyledTable>
          <TableRow
            gridAutoColumns="1fr 150px 150px 80px"
            mobileGridAutoColumns="1fr 100px 100px 60px"
          >
            <TableHeader>{t`Email`}</TableHeader>
            <TableHeader>{t`Granted By`}</TableHeader>
            <TableHeader>{t`Granted At`}</TableHeader>
            {isPrimarySuperAdmin && <TableHeader></TableHeader>}
          </TableRow>
          <StyledTableRows>
            {isLoading ? (
              <StyledNoMembers>{t`Loading...`}</StyledNoMembers>
            ) : superAdmins.length > 0 ? (
              superAdmins.map((admin) => (
                <TableRow
                  gridAutoColumns="1fr 150px 150px 80px"
                  mobileGridAutoColumns="1fr 100px 100px 60px"
                  key={admin.id}
                >
                  <TableCell>
                    <StyledEmailCell>
                      {admin.userEmail}
                      {admin.isPrimary && (
                        <StyledPrimaryBadge>
                          <IconShield size={12} />
                          {t`Primary`}
                        </StyledPrimaryBadge>
                      )}
                    </StyledEmailCell>
                  </TableCell>
                  <TableCell>{admin.grantedBy}</TableCell>
                  <TableCell>{formatDate(admin.grantedAt)}</TableCell>
                  {isPrimarySuperAdmin && (
                    <TableCell align="right">
                      {!admin.isPrimary && (
                        <StyledButtonContainer>
                          <IconButton
                            onClick={() => {
                              setSuperAdminToRemove(admin);
                              openModal(REMOVE_SUPER_ADMIN_MODAL_ID);
                            }}
                            variant="tertiary"
                            size="medium"
                            Icon={IconTrash}
                            disabled={removingAdmin}
                          />
                        </StyledButtonContainer>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <StyledNoMembers>{t`No Super Admins found`}</StyledNoMembers>
            )}
          </StyledTableRows>
        </StyledTable>

        {isPrimarySuperAdmin && (
          <StyledAddContainer>
            <Dropdown
              dropdownId={ADD_SUPER_ADMIN_DROPDOWN_ID}
              dropdownOffset={{ x: 0, y: 4 }}
              clickableComponent={
                <Button
                  Icon={IconPlus}
                  title={t`Add Super Admin`}
                  variant="secondary"
                  size="small"
                  disabled={addingAdmin}
                />
              }
              dropdownComponents={
                <SuperAdminMemberPickerDropdown
                  excludedEmails={excludedEmails}
                  onSelect={handleMemberSelect}
                />
              }
            />
          </StyledAddContainer>
        )}
      </Section>

      <ConfirmationModal
        modalId={ADD_SUPER_ADMIN_MODAL_ID}
        title={t`Add Super Admin`}
        subtitle={
          <Trans>
            Are you sure you want to grant Super Admin privileges to{' '}
            <strong>
              {selectedMemberName} ({selectedMemberEmail})
            </strong>
            ? They will be able to access Advanced Settings across all
            workspaces.
          </Trans>
        }
        onConfirmClick={handleAddSuperAdmin}
        confirmButtonText={t`Add Super Admin`}
        confirmButtonAccent="blue"
      />

      <ConfirmationModal
        modalId={REMOVE_SUPER_ADMIN_MODAL_ID}
        title={t`Remove Super Admin`}
        subtitle={
          <Trans>
            Are you sure you want to remove Super Admin privileges from{' '}
            <strong>{superAdminToRemoveEmail}</strong>? They will no longer be
            able to access Advanced Settings.
          </Trans>
        }
        onConfirmClick={handleRemoveSuperAdmin}
        confirmButtonText={t`Remove Super Admin`}
      />
    </>
  );
};
