from django.contrib import admin
from .models import MenuItem, Order, OrderItem, Review

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    # ✅ FIX: Replace 'emoji' with 'image_name'
    list_display = ('name', 'price', 'category', 'image_name') 
    list_filter = ('category',)
    search_fields = ('name', 'description')

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ('name', 'price', 'quantity')
    can_delete = False
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'order_total', 'order_status', 'delivery_type', 'date')
    list_filter = ('order_status', 'delivery_type', 'date')
    search_fields = ('customer_name', 'customer_email', 'id')
    inlines = [OrderItemInline]
    readonly_fields = ('order_total', 'date', 'customer_email', 'customer_phone', 'customer_name') # Prevent accidental changes

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('name', 'rating', 'comment', 'date', 'is_approved')
    list_filter = ('rating', 'is_approved')
    search_fields = ('name', 'comment')
    actions = ['approve_reviews']

    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)
    approve_reviews.short_description = "Approve selected reviews"