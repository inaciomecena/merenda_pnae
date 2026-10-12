import { useEffect, useMemo, useState } from 'react';
import {
  Box, Collapse, List, ListItemButton, ListItemIcon, ListItemText, Tooltip,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import type { MenuItemConfig } from '../config/menu.config';

interface HierarchicalMenuProps {
  items: MenuItemConfig[];
  onItemClick?: () => void;
  level?: number;
}

function containsPath(item: MenuItemConfig, pathname: string): boolean {
  if (item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`))) return true;
  return item.children?.some(child => containsPath(child, pathname)) ?? false;
}

function activeGroups(items: MenuItemConfig[], pathname: string): string[] {
  return items.flatMap(item => item.children && containsPath(item, pathname)
    ? [item.screenCode, ...activeGroups(item.children, pathname)]
    : []);
}

export function HierarchicalMenu({ items, onItemClick, level = 0 }: HierarchicalMenuProps) {
  const location = useLocation();
  const routeGroups = useMemo(() => activeGroups(items, location.pathname), [items, location.pathname]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set(routeGroups));

  useEffect(() => {
    setExpandedItems(previous => new Set([...previous, ...routeGroups]));
  }, [routeGroups]);

  const toggleExpand = (screenCode: string) => {
    setExpandedItems(previous => {
      const next = new Set(previous);
      if (next.has(screenCode)) next.delete(screenCode);
      else next.add(screenCode);
      return next;
    });
  };

  return (
    <List disablePadding sx={{ px: level === 0 ? 1 : 0 }}>
      {items.map(item => {
        const hasChildren = Boolean(item.children?.length);
        const expanded = expandedItems.has(item.screenCode);
        const active = item.path
          ? location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
          : false;
        const activeBranch = containsPath(item, location.pathname);

        const content = (
          <ListItemButton
            {...(item.path ? { component: Link, to: item.path } : { component: 'div' as const })}
            onClick={() => {
              if (hasChildren) toggleExpand(item.screenCode);
              else onItemClick?.();
            }}
            selected={active}
            aria-expanded={hasChildren ? expanded : undefined}
            sx={{
              borderRadius: 1,
              mb: 0.25,
              minHeight: level === 0 ? 42 : 38,
              pl: 1.5 + level * 1.75,
              pr: 1,
              bgcolor: activeBranch && !active ? '#f1f4f9' : 'transparent',
              '&.Mui-selected': {
                bgcolor: '#e8eaf6',
                color: '#01287c',
                '&:hover': { bgcolor: '#dce1f5' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: active ? '#01287c' : activeBranch ? '#344a72' : '#667085' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: level === 0 ? 13 : 12.5,
                fontWeight: active || (hasChildren && activeBranch) ? 600 : 400,
              }}
            />
            {hasChildren ? expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" /> : null}
          </ListItemButton>
        );

        return (
          <Box key={item.screenCode}>
            {item.description ? <Tooltip title={item.description} placement="right" arrow describeChild>{content}</Tooltip> : content}
            {hasChildren ? (
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <HierarchicalMenu items={item.children!} onItemClick={onItemClick} level={level + 1} />
              </Collapse>
            ) : null}
          </Box>
        );
      })}
    </List>
  );
}
