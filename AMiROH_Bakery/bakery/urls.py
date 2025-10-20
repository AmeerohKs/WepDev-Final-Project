from django.urls import path
from . import views

app_name = 'bakery'

urlpatterns = [
    path('', views.home, name='home'),
    path('menu/', views.menu_view, name='menu'),
    path('cart/', views.cart_view, name='cart'),
    path('reviews/', views.reviews_view, name='reviews'),
    path('about/', views.about_view, name='about'),
    path('account/', views.account_view, name='account'),

    # API endpoints
    path('orders/create/', views.create_order, name='create_order'),
    path('reviews/create/', views.create_review, name='create_review'),
]
