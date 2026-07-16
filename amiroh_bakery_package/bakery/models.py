from django.db import models
from django.contrib.auth.models import User # ใช้ User model ที่มีอยู่แล้วของ Django

class MenuItem(models.Model):
    """Represents a single item available on the bakery's menu."""
    
    CATEGORY_CHOICES = [
        ('cakes', 'Cakes'),
        ('pastries', 'Pastries'),
        ('bread', 'Bread'),
        ('drinks', 'Drinks'),
    ]

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(max_length=500)
    # Price is stored in THB after initial conversion
    price = models.DecimalField(max_digits=8, decimal_places=2) 
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='pastries')
    # Use image_name instead of emoji
    image_name = models.CharField(
        max_length=100, 
        default='default_cake.png', 
        help_text="Filename of the image (e.g., chocolate_cake.png). Place files in static/bakery/img/."
    )

    def __str__(self):
        return self.name

class Order(models.Model):
    """Represents a customer order."""

    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('ready', 'Ready for Pickup/Delivery'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    DELIVERY_CHOICES = [
        ('pickup', 'Store Pickup'),
        ('delivery', 'Home Delivery'),
    ]

    # Customer Information
    customer_name = models.CharField(max_length=100)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    
    # Order Details
    date = models.DateTimeField(auto_now_add=True)
    order_total = models.DecimalField(max_digits=10, decimal_places=2) # Max Digits adjusted for THB
    order_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    
    # Delivery/Pickup
    delivery_type = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='pickup')
    delivery_address = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Order #{self.id} - {self.customer_name}"
    
    class Meta:
        ordering = ['-date'] # Show newest orders first

class OrderItem(models.Model):
    """Represents a single item within an order."""
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=100) # Store name just in case MenuItem is deleted
    price = models.DecimalField(max_digits=8, decimal_places=2) # Price per unit (THB)
    quantity = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.name} in Order #{self.order.id}"

class Review(models.Model):
    """Represents a customer review."""

    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)]) # Rating 1 to 5
    comment = models.TextField(max_length=500)
    date = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False) # Admin must approve before showing

    def __str__(self):
        return f"Review by {self.name} - {self.rating} stars"
    
    class Meta:
        ordering = ['-date']
