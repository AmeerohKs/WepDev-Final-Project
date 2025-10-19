from django.contrib import admin
from .models import MenuItem, Review, Order

# Register your models here.
admin.site.register(MenuItem)
admin.site.register(Review)
admin.site.register(Order)

