from django.urls import path
from . import views

app_name = 'bakery'

urlpatterns = [
    # Render Views (HTML Pages)
    path('', views.home_view, name='home'),
    path('menu/', views.menu_view, name='menu'),
    path('cart/', views.cart_view, name='cart'),
    path('reviews/', views.reviews_view, name='reviews'),
    path('about/', views.about_view, name='about'),
    path('account/', views.account_view, name='account'), 

    # AJAX API Endpoints
    path('api/menu/', views.menu_api_view, name='api_menu'),
    path('api/review/submit/', views.review_submit_api_view, name='api_review_submit'),
    path('api/order/place/', views.place_order_api_view, name='api_order_place'),
    path('api/newsletter/signup/', views.newsletter_signup_api_view, name='api_newsletter_signup'),
]
