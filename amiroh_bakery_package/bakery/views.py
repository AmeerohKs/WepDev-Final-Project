import json
from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout

# 🌟 FIX: แยก Import models ออกมาจาก django.db
from django.db import models 
from django.db.models import F, Value, CharField 
from django.db.models.functions import Cast, Concat
from .models import MenuItem, Order, OrderItem, Review
from django.db import transaction
from decimal import Decimal 


# --- Render Views (For HTML Templates) ---

def home_view(request):
    """Renders the home page, passing featured items with formatted price."""
    # ดึง Featured Items 3 รายการล่าสุด
    featured_items = MenuItem.objects.all().annotate(
        price_thb_display=Concat(
            F('price'),  
            Value(' ฿'),
            output_field=CharField()
        )
    ).order_by('-id')[:3] 
    
    return render(request, 'bakery/home.html', {'featured_items': featured_items})

def menu_view(request):
    """Renders the menu page."""
    categories = MenuItem.CATEGORY_CHOICES
    return render(request, 'bakery/menu.html', {'categories': categories})

def cart_view(request):
    """Renders the cart page."""
    return render(request, 'bakery/cart.html')

def reviews_view(request):
    """Renders the reviews page and passes approved reviews for template loop."""
    # ดึงเฉพาะรีวิวที่ได้รับการอนุมัติเท่านั้น
    approved_reviews = Review.objects.filter(is_approved=True).order_by('-date')
    return render(request, 'bakery/reviews.html', {'reviews': approved_reviews})

def about_view(request):
    """Renders the about and contact page."""
    return render(request, 'bakery/about.html')

def account_view(request):
    """Renders the user account page."""
    user_orders = []
    return render(request, 'bakery/account.html', {'user_orders': user_orders})


# --- AJAX API Views (Backend Data Handling) ---

@csrf_exempt
@require_http_methods(["GET"])
def menu_api_view(request):
    """API endpoint to get all menu items, formatted with THB currency."""
    # Annotate price field by casting Decimal to CharField for concatenation
    items_query = MenuItem.objects.all().annotate(
        price_thb=Concat(
            # 🌟 ใช้ models.CharField แทน CharField()
            Cast(F('price'), output_field=models.CharField()), 
            Value(' ฿'),
            output_field=CharField()
        )
    ).values('id', 'name', 'price', 'price_thb', 'category', 'image_name', 'description') 
    
    items_list = list(items_query)
    
    return JsonResponse(items_list, safe=False)

@csrf_exempt
@require_http_methods(["POST"])
def review_submit_api_view(request):
    """API endpoint for submitting a review, saving it as unapproved."""
    try:
        data = json.loads(request.body)
        
        if not all(k in data for k in ('name', 'rating', 'comment')):
            return HttpResponseBadRequest(JsonResponse({'error': 'Missing required fields (name, rating, comment)'}, status=400))
        
        rating = int(data.get('rating'))
        if not 1 <= rating <= 5:
            return HttpResponseBadRequest(JsonResponse({'error': 'Rating must be between 1 and 5'}, status=400))
        
        Review.objects.create(
            name=data['name'],
            email=data.get('email'),
            rating=rating,
            comment=data['comment'],
            is_approved=False,
        )
        return JsonResponse({'message': 'Review submitted successfully! It will appear after approval.'})
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format (The request body must be valid JSON.)'}, status=400)
    except Exception as e:
        import traceback
        print(f"Review Submission Error: {traceback.format_exc()}")
        # 🌟 แจ้งเตือนข้อผิดพลาดทั่วไป
        return JsonResponse({'error': 'An internal error occurred during review submission.'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def place_order_api_view(request):
    """API endpoint for placing an order/checkout."""
    try:
        data = json.loads(request.body)
        
        required_fields = ['customer_name', 'customer_phone', 'customer_email', 'delivery_type', 'order_items', 'order_total']
        if not all(k in data for k in required_fields):
            return HttpResponseBadRequest(JsonResponse({'error': 'Missing required checkout fields'}, status=400))
            
        order_items_data = json.loads(data['order_items'])

        with transaction.atomic():
            new_order = Order.objects.create(
                customer_name=data['customer_name'],
                customer_phone=data['customer_phone'],
                customer_email=data['customer_email'],
                # 🌟 ใช้ str() เพื่อให้แน่ใจว่า Decimal รับค่าเป็น String ที่ถูกต้อง
                order_total=Decimal(str(data['order_total'])), 
                delivery_type=data['delivery_type'],
                delivery_address=data.get('delivery_address'),
            )

            for item_data in order_items_data:
                menu_item = MenuItem.objects.filter(name=item_data['name']).first()
                
                OrderItem.objects.create(
                    order=new_order,
                    menu_item=menu_item,
                    name=item_data['name'],
                    price=Decimal(str(item_data['price'])), # 🌟 ใช้ str() เพื่อให้แน่ใจว่า Decimal รับค่าเป็น String ที่ถูกต้อง
                    quantity=item_data['quantity'],
                )
        
        return JsonResponse({'message': 'Order placed successfully!', 'order_id': new_order.id})

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format (The request body must be valid JSON.)'}, status=400)
    except Exception as e:
        import traceback
        print(f"Checkout Error: {traceback.format_exc()}")
        # 🌟 แจ้งเตือนข้อผิดพลาดทั่วไป
        return JsonResponse({'error': 'An internal error occurred during checkout processing.'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def newsletter_signup_api_view(request):
    """API endpoint for newsletter signup (Placeholder)."""
    try:
        data = json.loads(request.body)
        email = data.get('newsletter_email')
        
        if not email:
            return HttpResponseBadRequest(JsonResponse({'error': 'Email is required'}, status=400))
        
        print(f"Newsletter signup logged: {email}") 
        
        return JsonResponse({'message': 'Thank you for subscribing!'})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=400)
    except Exception as e:
        import traceback
        print(f"Newsletter Signup Error: {traceback.format_exc()}")
        return JsonResponse({'error': f'An unexpected error occurred: {e}'}, status=500)
