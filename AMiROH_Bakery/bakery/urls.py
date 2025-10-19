from django.urls import path
from . import views

app_name = 'bakery'

urlpatterns = [
    path('', views.home_view, name='home'),
    path('menu/', views.menu_view, name='menu'),
    path('cart/', views.cart_view, name='cart'),
    path('reviews/', views.reviews_view, name='reviews'),
    path('about/', views.about_view, name='about'),
    path('account/', views.account_view, name='account'),
    
    # Forms / Actions
    path('review/submit/', views.submit_review, name='submit_review'),
    path('register/', views.register_user, name='register'),
]