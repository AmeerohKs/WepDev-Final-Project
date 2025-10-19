from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .models import MenuItem, Review
from django.db.models import Avg

def home_view(request):
    featured_items = MenuItem.objects.filter(is_featured=True)[:3]
    context = {'featured': featured_items}
    return render(request, 'bakery/home.html', context)

def menu_view(request):
    items = MenuItem.objects.all().order_by('category', 'name')
    context = {'menu_items': items}
    return render(request, 'bakery/menu.html', context)

def reviews_view(request):
    all_reviews = Review.objects.all().order_by('-date')
    context = {'reviews': all_reviews} # review_form is needed if using Django Forms
    return render(request, 'bakery/reviews.html', context)

@login_required
def account_view(request):
    # In a real app, you would fetch user's orders here
    # user_orders = Order.objects.filter(user=request.user)
    context = {'user': request.user}
    return render(request, 'bakery/account.html', context)

# Placeholder for form handling
def submit_review(request):
    if request.method == 'POST':
        # Logic to save review to database
        # Example: Review.objects.create(name=..., rating=..., comment=...)
        # Then redirect back to reviews page
        return redirect('bakery:reviews')
    return redirect('bakery:reviews') # Handle GET request

# Placeholder for other views
def cart_view(request):
    # This view would fetch the cart content from the user's session
    return render(request, 'bakery/cart.html', {})
    
def about_view(request):
    return render(request, 'bakery/about.html', {})

def register_user(request):
    # Handle user registration logic
    return redirect('bakery:home')