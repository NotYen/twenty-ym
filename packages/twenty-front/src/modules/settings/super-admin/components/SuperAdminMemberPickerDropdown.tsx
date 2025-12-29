import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { useObjectRecordSearchRecords } from '@/object-record/hooks/useObjectRecordSearchRecords';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { DropdownMenuSearchInput } from '@/ui/layout/dropdown/components/DropdownMenuSearchInput';
import { DropdownMenuSeparator } from '@/ui/layout/dropdown/components/DropdownMenuSeparator';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { type ChangeEvent, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { isDefined } from 'twenty-shared/utils';
import { MenuItem, MenuItemAvatar } from 'twenty-ui/navigation';

type SuperAdminMemberPickerDropdownProps = {
  excludedEmails: string[];
  onSelect: (email: string, memberName: string) => void;
};

export const SuperAdminMemberPickerDropdown = ({
  excludedEmails,
  onSelect,
}: SuperAdminMemberPickerDropdownProps) => {
  const [searchFilter, setSearchFilter] = useState('');
  const { t: tFunc } = useLingui();

  const { loading, searchRecords: workspaceMembers } =
    useObjectRecordSearchRecords({
      objectNameSingulars: [CoreObjectNameSingular.WorkspaceMember],
      searchInput: searchFilter,
    });

  const currentWorkspaceMembers = useRecoilValue(currentWorkspaceMembersState);

  const handleSearchFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(event.target.value);
  };

  // Filter out already added super admins
  const filteredWorkspaceMembers =
    workspaceMembers?.filter(
      (workspaceMember) => {
        const member = currentWorkspaceMembers.find(
          (m) => m.id === workspaceMember.recordId,
        );
        return member && !excludedEmails.includes(member.userEmail.toLowerCase());
      },
    ) ?? [];

  const enrichedWorkspaceMembers = filteredWorkspaceMembers
    .map((workspaceMember) =>
      currentWorkspaceMembers.find(
        (member) => member.id === workspaceMember.recordId,
      ),
    )
    .filter(isDefined);

  return (
    <DropdownContent widthInPixels={GenericDropdownContentWidth.ExtraLarge}>
      <DropdownMenuSearchInput
        value={searchFilter}
        onChange={handleSearchFilterChange}
        placeholder={tFunc`Search a team member...`}
      />
      <DropdownMenuSeparator />
      <DropdownMenuItemsContainer hasMaxHeight>
        {loading ? null : enrichedWorkspaceMembers.length === 0 ? (
          <MenuItem disabled text={searchFilter ? t`No Results` : t`No available members`} />
        ) : (
          enrichedWorkspaceMembers.map((workspaceMember) => {
            const fullName = `${workspaceMember.name.firstName ?? ''} ${workspaceMember.name.lastName ?? ''}`.trim();

            return (
              <MenuItemAvatar
                key={workspaceMember.id}
                onClick={() => onSelect(workspaceMember.userEmail, fullName)}
                avatar={{
                  type: 'rounded',
                  size: 'md',
                  placeholder: fullName,
                  placeholderColorSeed: workspaceMember.id,
                  avatarUrl: workspaceMember.avatarUrl,
                }}
                text={fullName}
                contextualText={workspaceMember.userEmail}
              />
            );
          })
        )}
      </DropdownMenuItemsContainer>
    </DropdownContent>
  );
};
