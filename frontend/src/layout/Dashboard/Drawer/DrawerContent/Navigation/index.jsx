// material-ui
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project import
import NavGroup from './NavGroup';
import menuItem from 'menu-items';
import { useAuth } from 'contexts/AuthContext';

// ==============================|| DRAWER CONTENT - NAVIGATION ||============================== //

export default function Navigation() {
  const { user } = useAuth();
  const userRole = user?.role || '';

  // Filter menu items based on user role
  const filteredItems = menuItem.items
    .map((group) => {
      if (!group.children) return group;

      const filteredChildren = group.children.filter((item) => {
        if (!item.roles) return true; // No roles restriction = visible to all
        return item.roles.includes(userRole);
      });

      if (filteredChildren.length === 0) return null;
      return { ...group, children: filteredChildren };
    })
    .filter(Boolean);

  const navGroups = filteredItems.map((item) => {
    switch (item.type) {
      case 'group':
        return <NavGroup key={item.id} item={item} />;
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Fix - Navigation Group
          </Typography>
        );
    }
  });

  return <Box sx={{ pt: 2 }}>{navGroups}</Box>;
}
