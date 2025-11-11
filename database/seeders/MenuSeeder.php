<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $master = Menu::create([
            'title' => 'Master Data',
            'icon' => 'Database',
            'route' => '#',
            'order' => 1,
            'permission_name' => 'access-view',
        ]);
        
        Menu::create([
            'title' => 'Product Categories',
            'icon' => 'Tag',
            'route' => '/admin/categories',
            'order' => 2,
            'permission_name' => 'permission-view',
            'parent_id' => $master->id,
        ]);
        
        Menu::create([
            'title' => 'Products',
            'icon' => 'Box',
            'route' => '/admin/products',
            'order' => 2,
            'permission_name' => 'permission-view',
            'parent_id' => $master->id,
        ]);

        // MENU: Dashboard
        // Menu::create([
        //     'title' => 'Dashboard',
        //     'icon' => 'Home',
        //     'route' => '/admin/dashboard',
        //     'order' => 1,
        //     'permission_name' => 'dashboard-view',
        // ]);

        // GROUP: Access
        $access = Menu::create([
            'title' => 'Access',
            'icon' => 'Contact',
            'route' => '#',
            'order' => 2,
            'permission_name' => 'access-view',
        ]);

        // Menu::create([
        //     'title' => 'Permissions',
        //     'icon' => 'AlertOctagon',
        //     'route' => '/admin/permissions',
        //     'order' => 2,
        //     'permission_name' => 'permission-view',
        //     'parent_id' => $access->id,
        // ]);

        Menu::create([
            'title' => 'Users',
            'icon' => 'Users',
            'route' => '/admin/users',
            'order' => 3,
            'permission_name' => 'users-view',
            'parent_id' => $access->id,
        ]);

        // Menu::create([
        //     'title' => 'Roles',
        //     'icon' => 'AlertTriangle',
        //     'route' => '/admin/roles',
        //     'order' => 4,
        //     'permission_name' => 'roles-view',
        //     'parent_id' => $access->id,
        // ]);

        // GROUP: Settings
        $settings = Menu::create([
            'title' => 'Settings',
            'icon' => 'Settings',
            'route' => '#',
            'order' => 3,
            'permission_name' => 'settings-view',
        ]);

        Menu::create([
            'title' => 'Menu Manager',
            'icon' => 'Menu',
            'route' => '/admin/menus',
            'order' => 1,
            'permission_name' => 'menu-view',
            'parent_id' => $settings->id,
        ]);

        Menu::create([
            'title' => 'App Settings',
            'icon' => 'AtSign',
            'route' => '/admin/settingsapp',
            'order' => 2,
            'permission_name' => 'app-settings-view',
            'parent_id' => $settings->id,
        ]);

        // Menu::create([
        //     'title' => 'Backup',
        //     'icon' => 'Inbox',
        //     'route' => '/admin/backup',
        //     'order' => 3,
        //     'permission_name' => 'backup-view',
        //     'parent_id' => $settings->id,
        // ]);

        // GROUP: Utilities
        // $utilities = Menu::create([
        //     'title' => 'Utilities',
        //     'icon' => 'CreditCard',
        //     'route' => '#',
        //     'order' => 4,
        //     'permission_name' => 'utilities-view',
        // ]);

        // Menu::create([
        //     'title' => 'Audit Logs',
        //     'icon' => 'Activity',
        //     'route' => '/admin/audit-logs',
        //     'order' => 2,
        //     'permission_name' => 'log-view',
        //     'parent_id' => $utilities->id,
        // ]);

        // Menu::create([
        //     'title' => 'File Manager',
        //     'icon' => 'Folder',
        //     'route' => '/admin/files',
        //     'order' => 3,
        //     'permission_name' => 'filemanager-view',
        //     'parent_id' => $utilities->id,
        // ]);

        $cms = Menu::create([
            'title' => 'CMS Settings',
            'icon' => 'Layout',
            'route' => '#',
            'order' => 2,
            'permission_name' => 'cms-view'
        ]);
        
        Menu::create([
            'title' => 'Whatsapp Contact',
            'icon' => 'MessageCircle',
            'route' => '/admin/floating_contacts',
            'order' => 1,
            'permission_name' => 'cms-view',
            'parent_id' => $cms->id,
        ]);
        Menu::create([
            'title' => 'Banner Management',
            'icon' => 'MessageCircle',
            'route' => '/admin/banners',
            'order' => 2,
            'permission_name' => 'cms-view',
            'parent_id' => $cms->id,
        ]);

        Menu::create([
            'title' => 'Site Menu',
            'icon' => 'Menu',
            'route' => '/admin/cms/menu',
            'order' => 1,
            'permission_name' => 'cms-view',
        ]);

        
        $permissions = Menu::pluck('permission_name')->unique()->filter();

        foreach ($permissions as $permName) {
            Permission::firstOrCreate(['name' => $permName]);
        }

        $role = Role::firstOrCreate(['name' => 'user']);
        $role->givePermissionTo('dashboard-view');
    }
}
