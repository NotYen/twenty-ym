import styled from '@emotion/styled';
import { Trans } from '@lingui/react/macro';

import { SettingsShareLinksTableRow } from '@/share-link/components/SettingsShareLinksTableRow';
import { useShareLinks } from '@/share-link/hooks/useShareLinks';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const StyledTableBody = styled(TableBody)`
  border-bottom: 1px solid ${({ theme }) => theme.border.color.light};
`;

const StyledEmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing(4)};
  text-align: center;
  color: ${({ theme }) => theme.font.color.tertiary};
`;

export const SettingsShareLinksTable = () => {
  const { shareLinks, loading, toggleShareLinkStatus, deleteShareLink } =
    useShareLinks();

  const gridAutoColumns = '3fr 2fr 2fr 2fr 2fr 3fr';

  if (loading) {
    return (
      <StyledEmptyState>
        <Trans>Loading...</Trans>
      </StyledEmptyState>
    );
  }

  return (
    <Table>
      <TableRow gridAutoColumns={gridAutoColumns}>
        <TableHeader>
          <Trans>Resource Type</Trans>
        </TableHeader>
        <TableHeader>
          <Trans>Access Mode</Trans>
        </TableHeader>
        <TableHeader>
          <Trans>Expires At</Trans>
        </TableHeader>
        <TableHeader>
          <Trans>Access Count</Trans>
        </TableHeader>
        <TableHeader>
          <Trans>Last Accessed</Trans>
        </TableHeader>
        <TableHeader>
          <Trans>Actions</Trans>
        </TableHeader>
      </TableRow>
      {shareLinks.length > 0 ? (
        <StyledTableBody>
          {shareLinks.map((shareLink) => (
            <SettingsShareLinksTableRow
              key={shareLink.id}
              shareLink={shareLink}
              onToggleStatus={toggleShareLinkStatus}
              onDelete={deleteShareLink}
            />
          ))}
        </StyledTableBody>
      ) : (
        <StyledEmptyState>
          <Trans>No share links created yet.</Trans>
        </StyledEmptyState>
      )}
    </Table>
  );
};
