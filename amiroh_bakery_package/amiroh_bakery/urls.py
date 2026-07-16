from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # เชื่อมต่อ URL ของแอป bakery ไปยัง root path
    path('', include('bakery.urls')), 
]