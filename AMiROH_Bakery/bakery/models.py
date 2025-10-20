from django.db import models
from django.contrib.auth.models import User

# ---------------------------
# 1. เมนูสินค้า
# ---------------------------
class MenuItem(models.Model):
    CATEGORY_CHOICES = [
        ('cakes', 'Cakes'),
        ('pastries', 'Pastries'),
        ('bread', 'Bread'),
        ('drinks', 'Drinks'),
    ]
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    emoji = models.CharField(max_length=10, blank=True)
    image = models.ImageField(upload_to='menu_images/', blank=True, null=True)

    def __str__(self):
        return self.name


# ---------------------------
# 2. รีวิวลูกค้า
# ---------------------------
class Review(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(blank=True, null=True)
    rating = models.IntegerField()
    comment = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.rating}⭐)"


# ---------------------------
# 3. ออเดอร์
# ---------------------------
class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    order_items = models.JSONField()
    order_total = models.DecimalField(max_digits=10, decimal_places=2)
    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=50)
    customer_email = models.EmailField()
    delivery_type = models.CharField(
        max_length=20,
        choices=[('pickup', 'Pickup'), ('delivery', 'Delivery')]
    )
    delivery_address = models.TextField(blank=True, null=True)
    order_status = models.CharField(max_length=50, default='Processing')
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.customer_name}"
