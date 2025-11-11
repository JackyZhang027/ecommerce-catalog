<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\UserFileController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\SettingAppController;
use App\Http\Controllers\MediaFolderController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\FloatingContactController;
use App\Http\Controllers\BannerController;
use App\Http\Controllers\ShopController;

Route::middleware(['auth', 'menu.permission'])->prefix('admin')->group(function () {
    Route::get('/', function () {
        return Inertia::render('home');
    })->name('admin.home');

    Route::resource('roles', RoleController::class);
    Route::resource('menus', MenuController::class);
    Route::post('menus/reorder', [MenuController::class, 'reorder'])->name('menus.reorder');
    Route::resource('permissions', PermissionController::class);
    Route::resource('users', UserController::class);
    Route::put('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
    Route::get('/settingsapp', [SettingAppController::class, 'edit'])->name('setting.edit');
    Route::post('/settingsapp', [SettingAppController::class, 'update'])->name('setting.update');
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
    Route::get('/backup', [BackupController::class, 'index'])->name('backup.index');
    Route::post('/backup/run', [BackupController::class, 'run'])->name('backup.run');
    Route::get('/backup/download/{file}', [BackupController::class, 'download'])->name('backup.download');
    Route::delete('/backup/delete/{file}', [BackupController::class, 'delete'])->name('backup.delete');
    Route::get('/files', [UserFileController::class, 'index'])->name('files.index');
    Route::post('/files', [UserFileController::class, 'store'])->name('files.store');
    Route::delete('/files/{id}', [UserFileController::class, 'destroy'])->name('files.destroy');
    Route::resource('media', MediaFolderController::class);

    // Product Category Routes
    Route::put('/categories/{category}/toggle', [ProductCategoryController::class, 'toggleActive'])
        ->name('categories.toggle');
        
    Route::delete('categories/{category}/media', [ProductCategoryController::class, 'destroyMedia'])
        ->name('categories.media.destroy');
    Route::resource('categories', ProductCategoryController::class);

    // Product Routes
    Route::put('/products/{product}/toggle', [ProductController::class, 'toggleActive'])
        ->name('products.toggle');
    Route::delete('/products/{product}/media/{media}', [ProductController::class, 'deleteMedia'])
        ->name('products.media.delete');
    Route::resource('products', ProductController::class);
    
    // Floating Contact Routes
    Route::put('/floating_contacts/{floating_contact}/toggle', [FloatingContactController::class, 'toggleActive'])
        ->name('floating_contacts.toggle');
    Route::resource('floating_contacts', FloatingContactController::class);

    // Banner Routes
    Route::put('/banners/{banner}/toggle', [BannerController::class, 'toggleActive'])
        ->name('banners.toggle');
    Route::resource('banners', BannerController::class);
});

// Shop Routes
Route::get('/', [ShopController::class, 'index'])->name('home');
Route::get('/shop', [ShopController::class, 'shop'])->name('shop.index');
Route::get('/products/{product:slug}', [ShopController::class, 'show'])->name('shop.product.show');
Route::get('/category/{slug}', [ShopController::class, 'category'])->name('shop.category');


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
