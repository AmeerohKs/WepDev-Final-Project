from django import forms
from .models import Review, Order

class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ['name', 'email', 'rating', 'comment']

class OrderForm(forms.ModelForm):
    class Meta:
        model = Order
        fields = ['order_items', 'order_total', 'customer_name', 'customer_phone',
                  'customer_email', 'delivery_type', 'delivery_address']
