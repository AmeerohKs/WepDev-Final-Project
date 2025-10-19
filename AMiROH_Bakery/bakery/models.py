from django.db import models
from django.contrib.auth.models import User

class MenuItem(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=6, decimal_places=2)
    category = models.CharField(max_length=50, default='pastries')
    image = models.ImageField(upload_to='menu_images/', blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name

class Review(models.Model):
    item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100) # For non-logged in users
    email = models.EmailField(blank=True, null=True)
    rating = models.IntegerField(default=5)
    comment = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    class Order(models.Model):
    # เชื่อมโยงกับ User (ถ้ามี)
    user = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)
    
    # ข้อมูลลูกค้า
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField()
    
    # ข้อมูลการสั่งซื้อ
    order_date = models.DateTimeField(auto_now_add=True)
    order_total = models.DecimalField(max_digits=8, decimal_places=2)
    order_status = models.CharField(max_length=50, default='Processing') # เช่น Processing, Completed, Cancelled
    
    # ข้อมูลการจัดส่ง
    DELIVERY_CHOICES = [
        ('pickup', 'Store Pickup'),
        ('delivery', 'Home Delivery'),
    ]
    delivery_type = models.CharField(max_length=10, choices=DELIVERY_CHOICES, default='pickup')
    delivery_address = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'Order #{self.id} - {self.customer_name}'

class OrderItem(models.Model):
    # รายละเอียดสินค้าในแต่ละ Order
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=6, decimal_places=2) # เพื่อบันทึกราคา ณ วันที่สั่งซื้อ

    def __str__(self):
        return f'{self.quantity} x {self.menu_item.name}'
    
    def __str__(self):
        return f'{self.rating} stars by {self.name}'