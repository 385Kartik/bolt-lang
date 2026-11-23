import React from 'react';

const BOLT_SOURCE = `
/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\components\Footer.bolt ─── */
component Footer:
    container styled as: bg-gray-50 pt-16 pb-8 px-8 border-t border-gray-200 mt-20:
        grid 3 styled as: max-w-7xl mx-auto gap-12:
            column:
                show "BoltStore" as title styled as: text-xl font-bold text-gray-900 mb-4
                show "The next generation of e-commerce built with the Bolt language." as desc styled as: text-gray-500 text-sm leading-relaxed
                
            column:
                show "Quick Links" as title styled as: font-semibold text-gray-900 mb-4
                column styled as: gap-2 text-sm text-gray-500:
                    link "Home" to home
                    link "Products" to products
                    link "About" to about
                    
            column:
                show "Subscribe" as title styled as: font-semibold text-gray-900 mb-4
                show "Get the latest updates and offers." as desc styled as: text-sm text-gray-500 mb-4
                row styled as: gap-2:
                    container styled as: flex-1 bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-400:
                        show "Email address..."
                    button "Join" as primary styled as: bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700

        container styled as: border-t border-gray-200 mt-12 pt-8 text-center text-sm text-gray-500:
            show "© 2026 BoltStore. All rights reserved."


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\components\Modal.bolt ─── */
component Modal takes title:
    column styled as: bg-white rounded-lg shadow-xl p-6 border border-gray-200:
        show title as title styled as: text-xl font-bold text-gray-800 mb-4
        show children


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\components\Navbar.bolt ─── */
component Navbar:
    row styled as: flex justify-between items-center py-4 px-8 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50:
        show "BoltStore" as title styled as: text-2xl font-black text-blue-600 tracking-tighter
        
        row styled as: flex gap-6 text-sm font-medium text-gray-600:
            link "Home" to home styled as: link-hover
            link "Products" to products styled as: link-hover
            link "About" to about styled as: link-hover
            link "Contact" to contact styled as: link-hover
            link "Team" to team styled as: link-hover
            link "Admin" to admin styled as: link-hover
        
        row styled as: flex gap-4 items-center:
            if logged in:
                button "Logout" styled as: text-sm font-medium text-gray-500 hover:text-gray-900:
                    logout
                    show toast "Logged out" as success
            otherwise:
                link "Login" to login styled as: text-sm font-medium text-gray-500 hover:text-gray-900
                link "Sign Up" to signup styled as: bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700
                
            button "Cart (" + count of cart + ")" as secondary styled as: bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\components\ProductCard.bolt ─── */
component ProductCard for product:
    card styled as: flex flex-col p-0 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group cursor-pointer overflow-hidden:
        container styled as: aspect-[4/3] bg-gray-50 overflow-hidden center-flex p-6:
            image product.image styled as: h-full w-full object-contain group-hover:scale-110 transition-transform duration-500
                
        column styled as: gap-2 p-5:
            row styled as: justify-between items-center:
                show product.category as category styled as: text-[10px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-full
                row styled as: gap-1 items-center:
                    show "★" as star styled as: text-yellow-500 text-sm
                    show product.rating.rate as rating styled as: text-gray-700 text-xs font-semibold
                    show "·" as dot styled as: text-gray-300 text-xs
                    show product.rating.count as count styled as: text-gray-400 text-xs
                    show "reviews" as label styled as: text-gray-400 text-xs

            show product.title as name styled as: font-semibold text-gray-900 text-sm line-clamp-2 leading-snug mt-1
            show product.description as desc styled as: text-xs text-gray-400 line-clamp-2 leading-relaxed

            row styled as: justify-between items-center mt-3 pt-3 border-t border-gray-100:
                column:
                    show "Price" as label styled as: text-[10px] text-gray-400 uppercase tracking-wider font-medium
                    show product.price as price styled as: heading-black text-xl
                column styled as: items-end:
                    show "In Stock" as stock styled as: text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full
            
            row styled as: gap-2 mt-3:
                button "View Details" as secondary styled as: flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium text-sm transition-colors:
                    go to product(product.id)
                button "Add to Cart" as primary styled as: flex-1 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg font-medium text-sm transition-colors:
                    if logged in:
                        add product to cart
                        show toast "Added to cart" as success
                    otherwise:
                        show toast "Please login first" as danger
                        go to login


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\components\TeamCard.bolt ─── */
component TeamCard for member:
    card styled as: p-0 bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group:
        container styled as: h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500:
            show "" as spacer

        column styled as: p-6 gap-3:
            row styled as: gap-4 items-center:
                container styled as: w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full center-flex text-white font-bold text-xl shadow-lg:
                    show member.name as avatar
                column:
                    show member.name as name styled as: font-bold text-gray-900 text-lg
                    show member.email as email styled as: text-sm text-blue-500

            container styled as: h-px bg-gray-100 w-full my-1:
                show "" as divider

            row styled as: gap-2 items-center:
                show "🏢" as icon1
                show member.company.name as company styled as: text-sm font-semibold text-gray-700
            
            show member.company.catchPhrase as catchphrase styled as: text-xs text-gray-400 italic pl-7

            row styled as: gap-2 items-center:
                show "📍" as icon2
                show member.address.city as city styled as: text-sm text-gray-600
                show "·" as sep styled as: text-gray-300
                show member.address.street as street styled as: text-sm text-gray-400

            row styled as: gap-2 items-center:
                show "🌐" as icon3
                show member.website as website styled as: text-sm text-blue-500 underline

            row styled as: gap-2 items-center:
                show "📞" as icon4
                show member.phone as phone styled as: text-sm text-gray-500

            row styled as: gap-4 mt-2:
                container styled as: flex-1 bg-gray-50 rounded-lg p-3 text-center:
                    show "LAT" as latlabel styled as: text-[10px] text-gray-400 uppercase tracking-wider font-bold
                    show member.address.geo.lat as lat styled as: text-sm font-mono text-gray-700
                container styled as: flex-1 bg-gray-50 rounded-lg p-3 text-center:
                    show "LNG" as lnglabel styled as: text-[10px] text-gray-400 uppercase tracking-wider font-bold
                    show member.address.geo.lng as lng styled as: text-sm font-mono text-gray-700


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\design.bolt ─── */
design system:
    themes:
        light:
            background: "#ffffff"
            text: "#0f172a"
            cardBg: "#f8fafc"
            border: "#e2e8f0"
            primary: "#2563eb"
            
        dark:
            background: "#0f172a"
            text: "#f8fafc"
            cardBg: "#1e293b"
            border: "#334155"
            primary: "#3b82f6"

    components:
        card: "bg-cardBg text-text border border-border rounded-xl shadow-sm p-6"
        
        button primary: "bg-primary text-white rounded-xl px-4 py-2"
        
        button secondary: "bg-cardBg text-text border border-border rounded-xl px-4 py-2"


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\layout.bolt ─── */
layout:
    show Navbar
    slot
    show Footer


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\pages\about.bolt ─── */
page about:
    
    section styled as: max-w-4xl mx-auto px-8 py-24:
        
        column styled as: text-center mb-16:
            show "About BoltStore" as title styled as: text-5xl heading-black tracking-tight mb-6
            show "We're pushing the boundaries of what's possible with modern web technologies." as subtitle styled as: text-xl text-gray-500
            
        column styled as: prose prose-lg prose-blue mx-auto text-gray-600 leading-relaxed:
            show "Our Mission" as h2 styled as: text-3xl font-bold text-gray-900 mb-6 mt-12
            
            show "This e-commerce store is entirely built using the new Bolt programming language. Bolt allows developers to write less code while generating highly optimized React applications." as p1 styled as: mb-6
            
            show "The Technology" as h2_2 styled as: text-3xl font-bold text-gray-900 mb-6 mt-12
            
            column styled as: gap-4 mb-12:
                row styled as: gap-4 items-start:
                    container styled as: avatar-badge:
                        show "1" as idx1
                    show "Custom Lexer and Parser written from scratch." as desc1
                    
                row styled as: gap-4 items-start:
                    container styled as: avatar-badge:
                        show "2" as idx2
                    show "Generates standard AST nodes." as desc2
                    
                row styled as: gap-4 items-start:
                    container styled as: avatar-badge:
                        show "3" as idx3
                    show "Compiles directly to React and Tailwind CSS." as desc3
                    
                row styled as: gap-4 items-start:
                    container styled as: avatar-badge:
                        show "4" as idx4
                    show "Supports multi-file architecture and automatic routing." as desc4
                    
        hero styled as: mt-20 p-12 bg-gray-900 rounded-3xl text-center text-white:
            show "Ready to explore?" as ctaTitle styled as: text-3xl font-bold mb-6
            link "Start Shopping" to products styled as: inline-block px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-bold transition-colors
            


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\pages\admin.bolt ─── */
// Phase 3: Reusable Actions
// Actions decouple business logic from UI components.
action createProduct(name, price):
    submit "https://fakestoreapi.com/products" with { title: name, price: price, description: "New item", image: "https://i.pravatar.cc", category: "electronic" }:
        success result:
            give result
        error err:
            give err

page admin:
    remember newName = ""
    remember newPrice = "0"
    

    container styled as: max-w-4xl mx-auto px-8 py-16:
        // Phase 4: Authentication natively built in
        if not logged in:
            card styled as: soft-panel:
                show "Admin Login" as title styled as: text-3xl font-black mb-4
                show "Please log in to access the dashboard." as desc styled as: text-gray-600 mb-6
                
                button "Mock Login" as primary:
                    // Auto-saves session to localStorage if token is returned
                    login "https://fakestoreapi.com/auth/login" with { username: "mor_2314", password: "83r5^_" }
                    
        if logged in:
            show "Admin Dashboard" as title styled as: text-4xl font-black mb-2
            // Global user object is injected automatically!
            show "Welcome back!" as sub styled as: text-gray-500 mb-8
            
            button "Logout" as secondary styled as: mb-8:
                logout
                
            card styled as: soft-panel:
                show "Add New Product" as stitle styled as: section-title
                
                row styled as: gap-4 mb-4:
                    column:
                        show "Product Name" as l1 styled as: text-sm font-semibold text-gray-700 mb-1
                        input "Enter name" into newName styled as: px-4 py-2 border rounded-lg w-full
                    column:
                        show "Price" as l2 styled as: text-sm font-semibold text-gray-700 mb-1
                        input "Enter price" into newPrice styled as: px-4 py-2 border rounded-lg w-full
                
                button "Submit Product" as primary styled as: mt-4:
                    response = run createProduct(newName, newPrice)
                    show toast "Product Created Successfully!" as success
                    newName = ""
                    newPrice = "0"

            card styled as: soft-panel:
                show "Update/Delete Actions" as atitle styled as: section-title
                show "FakeStore API allows mocking these actions. Check network tab." as desc styled as: text-sm text-gray-500 mb-4
                
                row styled as: gap-4:
                    button "Update Product #1" as secondary:
                        update "https://fakestoreapi.com/products/1" with { title: "Updated Name", price: 99.99 }:
                            success:
                                show toast "Updated successfully!" as success
                    
                    button "Delete Product #1" styled as: bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors:
                        show modal "Are you sure you want to delete this product?"
                        delete "https://fakestoreapi.com/products/1":
                            success:
                                show toast "Deleted successfully!" as success



/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\pages\contact.bolt ─── */
page contact:
    
    
    container styled as: py-12:
        hero styled as: bg-gray-900 text-white p-12 rounded-3xl text-center mb-12:
            show "Contact Us" as title
            show "We'd love to hear from you." as subtitle
            
        row styled as: gap-12:
            column styled as: w-full lg:w-1/2:
                card:
                    show "Send a Message" as title styled as: text-2xl font-bold mb-6
                    form styled as: flex flex-col gap-4:
                        input "Your Name" into name styled as: p-3 border rounded-lg w-full
                        input "Email Address" into email styled as: p-3 border rounded-lg w-full
                        input "Your Message" into message styled as: p-3 border rounded-lg w-full min-h-[120px]
                        button "Submit" as primary styled as: w-full py-3 mt-4:
                            submit "https://jsonplaceholder.typicode.com/posts" with { name: name, email: email, message: message }
                            name = ""
                            email = ""
                            message = ""
                        
            column styled as: w-full lg:w-1/2 flex flex-col gap-6:
                card:
                    show "Watch Our Story (Public Folder)" as title styled as: section-title
                    video "/demo.mp4" styled as: w-full rounded-xl
                    
                card:
                    show "Our Headquarters (Public Folder)" as title styled as: section-title
                    image "/office.jpg" styled as: w-full rounded-xl object-cover
                    
                card:
                    show "Product Demo (External URL)" as title styled as: section-title
                    video "https://www.w3schools.com/html/mov_bbb.mp4" styled as: w-full rounded-xl
                    
                card:
                    show "Remote Office (External URL)" as title styled as: section-title
                    image "https://picsum.photos/600/300" styled as: w-full rounded-xl object-cover
                    


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\pages\home.bolt ─── */
page home:
    fetch "https://fakestoreapi.com/products?limit=4" into featured
    store showTestModal = false

    
    hero:
        container styled as: inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6:
            show "🚀 Built with Bolt Language" as text
            
        show "The Future of Shopping" as title styled as: text-5xl md:text-7xl font-black tracking-tight text-gray-900 mb-6 leading-tight
        
        show "Experience blazing fast performance with our new generated e-commerce platform. No more bloated JavaScript." as subtitle styled as: text-xl text-gray-500 max-w-2xl mb-10 leading-relaxed
        
        row styled as: gap-4:
            link "Shop Collection" to products styled as: px-8 py-4 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200
            link "Learn More" to about styled as: px-8 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 rounded-xl font-bold transition-all

    section styled as: max-w-7xl mx-auto px-8 py-20:
        show "Theme Preferences" as title styled as: text-3xl heading-black mb-2
        row styled as: gap-4 mb-10:
            button "Light Theme":
                theme = "light"
            button "Dark Theme":
                theme = "dark"
            button "System Theme":
                theme = "system"

        show "Featured Products" as title styled as: text-3xl heading-black mb-2
        show "Handpicked items fetched live from FakeStore API" as subtitle styled as: text-gray-400 mb-10

        if featured == null:
            show "Loading featured products..." as loading styled as: text-center text-gray-400 py-12 animate-pulse

        // Phase 11: Wrapper Component Test
        button "Test Modal Component" as secondary:
            showTestModal = true
            
        if showTestModal:
            show Modal with title="Warning":
                show "Are you sure you want to delete this item? This action cannot be undone." as text styled as: text-gray-600 mb-6
                row styled as: gap-3 justify-end:
                    button "Cancel" as secondary:
                        showTestModal = false
                    button "Delete" as danger:
                        showTestModal = false
        if featured != null:
            grid 4 styled as: gap-6:
                show ProductCard for each product in featured
            
    section styled as: max-w-7xl mx-auto px-8 py-20:
        grid 3 styled as: gap-8:
            
            card:
                container styled as: icon-box:
                    show "⚡" as emoji1
                show "Lightning Fast" as title1 styled as: card-title
                show "Compiled directly to React for maximum performance." as desc1 styled as: body-text
                
            card:
                container styled as: icon-box:
                    show "🎨" as emoji2
                show "Beautiful UI" as title2 styled as: card-title
                show "Styled with Tailwind CSS for perfect modern aesthetics." as desc2 styled as: body-text
                
            card:
                container styled as: icon-box:
                    show "📱" as emoji3
                show "Responsive" as title3 styled as: card-title
                show "Looks amazing on any device, anywhere." as desc3 styled as: body-text
                


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\pages\login.bolt ─── */
page login:
    layout none
    
    show Navbar
    
    section styled as: max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100:
        show "Welcome Back" as title styled as: text-3xl heading-black mb-2 text-center
        show "Enter your details to access your account." as subtitle styled as: text-gray-500 mb-8 text-center
        
        form:
            input "Email Address" into email:
                required
                email
                
            input "Password" into password:
                required
                min 8
                
            submit "Login" as primary styled as: w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold mt-4 shadow-lg shadow-blue-200 transition-all:
                submit "http://localhost:3001/api/login" with { email: email, password: password }:
                    success res:
                        if res.error:
                            show toast res.error as danger
                        otherwise:
                            run loginUser(res)
                            show toast "Logged in successfully!" as success
                            go to products
                    error err:
                        show toast "Network error" as danger
                        
        row styled as: justify-center mt-6 gap-2 text-sm:
            show "Don't have an account?" as prompt styled as: text-gray-500
            link "Sign up" to signup styled as: font-bold text-blue-600 hover:text-blue-700


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\pages\product.bolt ─── */
page product(id):
    
    // Fetch product details based on the dynamic ID
    fetch "https://fakestoreapi.com/products/" + id into product:
        loading:
            section styled as: max-w-7xl mx-auto px-8 py-32 text-center:
                show "Loading product details..." styled as: text-xl text-gray-500 animate-pulse
        error err:
            section styled as: max-w-7xl mx-auto px-8 py-32 text-center:
                show "Error loading product!" as title styled as: text-red-500 font-bold mb-4
                show err as subtitle styled as: text-gray-500
        success:
            section styled as: max-w-7xl mx-auto px-8 py-24:
                row styled as: items-start gap-12 flex-col md:flex-row:
                    // Product Image
                    container styled as: flex-1 bg-white p-12 rounded-3xl border border-gray-100 shadow-sm:
                        image product.image styled as: w-full h-auto max-h-[500px] object-contain
                    
                    // Product Details
                    column styled as: flex-1:
                        show product.category styled as: text-sm font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full inline-block w-max mb-6
                        
                        show product.title as title styled as: text-4xl md:text-5xl heading-black leading-tight mb-6
                        
                        row styled as: items-center gap-4 mb-8:
                            show "★ " + product.rating.rate styled as: text-lg font-bold text-yellow-500
                            show "(" + product.rating.count + " reviews)" styled as: text-gray-500
                        
                        show "\$" + product.price as price styled as: text-5xl heading-black mb-8
                        
                        show "Description" as label styled as: text-lg font-bold text-gray-900 mb-3
                        show product.description as text styled as: body-text text-lg mb-10
                        
                        row styled as: gap-4:
                            button "Add to Cart" as primary styled as: flex-1 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg transition-colors:
                                if logged in:
                                    add product to cart
                                    show toast "Added to cart!" as success
                                otherwise:
                                    show toast "Please login first" as danger
                                    go to login
                                    
                            button "Back to Home" as secondary styled as: py-4 px-8 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors:
                                go to home



/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\pages\products.bolt ─── */
page products:
    
    hero styled as: bg-gray-900 text-white py-20 px-8 text-center:
        show "Our Collection" as title styled as: text-4xl md:text-5xl font-black tracking-tight mb-4
        // Phase 1: Native String interpolation!
        show "Live products from FakeStore API — powered by Bolt's fetch keyword!" as subtitle styled as: text-gray-400 text-lg max-w-2xl mx-auto
        
    // Phase 2: Fetch natively handles HTTP fetching, JSON parsing, state management, and loading/error/success rendering states!
    fetch "http://localhost:3001/api/products" into products:
        loading:
            show "Loading amazing products..." styled as: text-xl font-bold text-gray-500 animate-pulse text-center py-20
        error err:
            show "Failed to load products: " + err styled as: text-red-500 text-center py-20
        empty:
            show "No products found in this category." styled as: text-gray-500 text-center py-20
        success:
            section styled as: max-w-7xl mx-auto px-8 py-16:
                row styled as: flex-wrap gap-4 mb-12 border-b border-gray-100 pb-8:
                    button "All Items" styled as: px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-medium
                    button "Electronics" styled as: pill-button
                    button "Jewelry" styled as: pill-button
                    button "Clothing" styled as: pill-button
                
                // Native loop rendering
                grid 4 styled as: gap-6:
                    show ProductCard for each product in products
            


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\pages\signup.bolt ─── */
page signup:
    layout none
    
    show Navbar
    
    section styled as: max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100:
        show "Create Account" as title styled as: text-3xl heading-black mb-2 text-center
        show "Join the future of shopping today." as subtitle styled as: text-gray-500 mb-8 text-center
        
        form:
            input "Email Address" into email:
                required
                email
                
            input "Password" into password:
                required
                min 8
                
            submit "Sign Up" as primary styled as: w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold mt-4 shadow-lg shadow-blue-200 transition-all:
                submit "http://localhost:3001/api/signup" with { email: email, password: password }:
                    success res:
                        if res.error:
                            show toast res.error as danger
                        otherwise:
                            run loginUser(res)
                            show toast "Signed up successfully!" as success
                            go to products
                    error err:
                        show toast "Network error" as danger
                        
        row styled as: justify-center mt-6 gap-2 text-sm:
            show "Already have an account?" as prompt styled as: text-gray-500
            link "Log in" to login styled as: font-bold text-blue-600 hover:text-blue-700


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\pages\store_test.bolt ─── */
global store cart = []

component Header:
    row:
        show "My Store" as title
        if count of cart > 0:
            show "Cart Items: "
            show count of cart
        otherwise:
            show "Cart is empty!"

page store_test:
    layout none
    column:
        show Header
        show "Products" as title
        
        button "Add Apple":
            add "Apple" to cart
            
        button "Add Banana":
            add "Banana" to cart
            
        button "Clear Cart":
            clear cart
            
        show "Current Cart:"
        show all cart


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\pages\team.bolt ─── */
page team:
    fetch "https://jsonplaceholder.typicode.com/users" into members


    container styled as: py-12:
        hero styled as: bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-12 rounded-3xl text-center mb-12:
            show "Our Team" as title styled as: text-4xl md:text-5xl font-black mb-4
            show "Meet the people behind the brand — fetched live from JSONPlaceholder API" as subtitle styled as: text-purple-200 text-lg max-w-2xl mx-auto
            show "This page demonstrates deeply nested API data: member.company.name, member.address.geo.lat, and more!" as hint styled as: text-purple-300/60 text-sm mt-4 font-mono

        if members == null:
            container styled as: text-center py-20:
                show "Loading team members..." as loading styled as: text-gray-400 text-lg animate-pulse

        if members != null:
            grid 2 styled as: gap-6:
                show TeamCard for each member in members



/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\styles.bolt ─── */
styles:
    center-flex: flex items-center justify-center
    avatar-badge: w-8 h-8 rounded-full bg-blue-100 text-blue-600 center-flex font-bold shrink-0
    icon-box: w-12 h-12 bg-white rounded-xl shadow-sm center-flex mb-6 text-xl
    pill-button: px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors
    soft-panel: p-8 bg-gray-50 rounded-2xl mb-8
    link-hover: hover:text-blue-600 transition-colors
    heading-black: font-black text-gray-900
    section-title: text-xl font-bold mb-4
    card-title: font-bold text-xl mb-3
    body-text: text-gray-500 leading-relaxed


/* ─── File: C:\Users\Radhe Krishn\OneDrive\Desktop\Projects\Bolt\store-app\src\testauth.bolt ─── */
page testauth:
    layout none
    if not logged in:
        show "You are not logged in!"
        button "Login":
            login env.API_URL + "/login" with { email: "test@example.com", password: "password" }
    
    if logged in:
        show "Welcome, " + user.name + "!"
        button "Logout":
            logout

`.split('\n');

function getHint(errorMsg) {
  if (!errorMsg) return "Check your variables.";
  if (errorMsg.includes("reading 'name'")) return "Check if the object is null before reading its 'name' property. Example: if item:";
  if (errorMsg.includes("reading")) return "You are trying to read a property from a null or undefined value. Ensure the variable is initialized.";
  if (errorMsg.includes("is not a function")) return "You are calling something that isn't a function. Check your component names.";
  return "Check your variables and data flow.";
}

export default class BoltErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const e = this.state.error;
      const lineNum = e.__boltLine;
      const codeSnippet = lineNum ? BOLT_SOURCE[lineNum - 1] : '';

      return (
        <div style={{ padding: '40px', background: '#111', color: '#ff5555', fontFamily: 'monospace', height: '100vh', width: '100vw', boxSizing: 'border-box', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
          <h1 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '1px solid #ff5555', paddingBottom: '10px' }}>
            ⚡ Bolt Runtime Error
          </h1>
          
          <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '30px' }}>
            {e ? e.toString() : 'Unknown Error'}
          </h2>

          {lineNum && (
            <div style={{ background: '#222', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
              <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '10px' }}>
                <strong>File:</strong> app.bolt<br/>
                <strong>Line:</strong> {lineNum}
              </div>
              
              <div style={{ background: '#000', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #ff5555', color: '#ffd700', fontSize: '16px' }}>
                {codeSnippet}
              </div>
            </div>
          )}

          <div style={{ background: '#222', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '16px' }}>Hint:</h3>
            <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
              {getHint(e ? e.message : '')}
            </p>
          </div>

          <details style={{ whiteSpace: 'pre-wrap', marginTop: '30px', color: '#888', fontSize: '12px' }}>
            <summary style={{ cursor: 'pointer', outline: 'none' }}>View raw stack trace (React internals)</summary>
            <div style={{ marginTop: '10px' }}>
              {this.state.errorInfo ? this.state.errorInfo.componentStack : null}
              <br /><br />
              {e && e.stack}
            </div>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}