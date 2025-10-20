from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest
from .models import MenuItem, Review, Order
from .forms import ReviewForm, OrderForm
import json


# หน้า Home
def home(request):
    featured = MenuItem.objects.all()[:3]
    return render(request, 'bakery/home.html', {'featured': featured})


# หน้า Menu
def menu_view(request):
    items = MenuItem.objects.all()
    return render(request, 'bakery/menu.html', {'menu_items': items})


# หน้า Cart
def cart_view(request):
    return render(request, 'bakery/cart.html')


# หน้า Reviews
def reviews_view(request):
    reviews = Review.objects.order_by('-date')
    form = ReviewForm()
    return render(request, 'bakery/reviews.html', {'reviews': reviews, 'form': form})


# หน้า About
def about_view(request):
    return render(request, 'bakery/about.html')


# หน้า Account
def account_view(request):
    return render(request, 'bakery/account.html')


# ---------------------------
# API Endpoints
# ---------------------------

# 1. บันทึกออเดอร์
def create_order(request):
    if request.method != 'POST':
        return HttpResponseBadRequest("POST only")
    try:
        data = json.loads(request.body)
        order = Order.objects.create(
            order_items=data.get('order_items'),
            order_total=data.get('order_total'),
            customer_name=data.get('customer_name'),
            customer_phone=data.get('customer_phone'),
            customer_email=data.get('customer_email'),
            delivery_type=data.get('delivery_type'),
            delivery_address=data.get('delivery_address', '')
        )
        return JsonResponse({'ok': True, 'order_id': order.id})
    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)})


# 2. บันทึกรีวิว
def create_review(request):
    if request.method != 'POST':
        return HttpResponseBadRequest("POST only")
    try:
        data = json.loads(request.body)
        review = Review.objects.create(
            name=data.get('name'),
            email=data.get('email'),
            rating=int(data.get('rating', 0)),
            comment=data.get('comment')
        )
        return JsonResponse({'ok': True, 'review_id': review.id})
    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)})
