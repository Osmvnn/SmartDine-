# Diagram generator for the SmartDine graduation project report.
# Produces simple but accurate box/line UML-style diagrams as PNG files.

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUT = 'C:/smart_resturant/report_assets/'

ACTOR_COLOR = '#1e293b'
UC_FACE = '#eef2ff'
UC_EDGE = '#4f46e5'
BOX_FACE = '#f8fafc'
BOX_EDGE = '#334155'
LINE_COLOR = '#64748b'


def new_fig(w, h, title=None):
    fig, ax = plt.subplots(figsize=(w, h), dpi=150)
    ax.set_xlim(0, w)
    ax.set_ylim(0, h)
    ax.axis('off')
    ax.set_aspect('equal')
    if title:
        ax.text(w / 2, h - 0.25, title, ha='center', va='top', fontsize=13, fontweight='bold')
    return fig, ax


def draw_actor(ax, x, y, label, scale=0.55):
    head = patches.Circle((x, y + 1.55 * scale), 0.22 * scale, fill=False, lw=1.6, edgecolor=ACTOR_COLOR)
    ax.add_patch(head)
    ax.plot([x, x], [y + 1.33 * scale, y + 0.55 * scale], '-', lw=1.6, color=ACTOR_COLOR)
    ax.plot([x - 0.38 * scale, x + 0.38 * scale], [y + 1.05 * scale, y + 1.05 * scale], '-', lw=1.6, color=ACTOR_COLOR)
    ax.plot([x, x - 0.35 * scale], [y + 0.55 * scale, y], '-', lw=1.6, color=ACTOR_COLOR)
    ax.plot([x, x + 0.35 * scale], [y + 0.55 * scale, y], '-', lw=1.6, color=ACTOR_COLOR)
    ax.text(x, y - 0.18, label, ha='center', va='top', fontsize=9, fontweight='bold', color=ACTOR_COLOR)


def draw_usecase(ax, x, y, w, h, label, fontsize=8.2):
    e = patches.Ellipse((x, y), w, h, facecolor=UC_FACE, edgecolor=UC_EDGE, lw=1.2, zorder=2)
    ax.add_patch(e)
    ax.text(x, y, label, ha='center', va='center', fontsize=fontsize, color='#1e1b4b', zorder=3, wrap=True)


def draw_box(ax, x, y, w, h, lines, facecolor=BOX_FACE, edgecolor=BOX_EDGE, title_fontsize=9, body_fontsize=8):
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.06",
                                   facecolor=facecolor, edgecolor=edgecolor, lw=1.2, zorder=2)
    ax.add_patch(rect)
    if isinstance(lines, str):
        ax.text(x + w / 2, y + h / 2, lines, ha='center', va='center', fontsize=title_fontsize, zorder=3)
        return
    title = lines[0]
    body = lines[1:]
    ax.text(x + w / 2, y + h - 0.16, title, ha='center', va='top', fontsize=title_fontsize,
            fontweight='bold', zorder=3)
    ax.plot([x + 0.06, x + w - 0.06], [y + h - 0.32, y + h - 0.32], '-', lw=0.8, color=edgecolor, zorder=3)
    for i, ln in enumerate(body):
        ax.text(x + 0.12, y + h - 0.48 - i * 0.24, ln, ha='left', va='top', fontsize=body_fontsize, zorder=3)


def connect(ax, p1, p2, style='-', color=LINE_COLOR, lw=1.1, label=None, zorder=1):
    ax.plot([p1[0], p2[0]], [p1[1], p2[1]], style, color=color, lw=lw, zorder=zorder)
    if label:
        mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
        ax.text(mx, my, label, fontsize=7.5, color='#334155', ha='center', va='center',
                bbox=dict(boxstyle='round,pad=0.1', fc='white', ec='none'), zorder=4)


def arrow(ax, p1, p2, color='#1e293b', lw=1.2, style='-|>'):
    ax.annotate('', xy=p2, xytext=p1,
                 arrowprops=dict(arrowstyle=style, color=color, lw=lw, shrinkA=2, shrinkB=2))


# ---------------------------------------------------------------------------
# 1. General use-case diagram
# ---------------------------------------------------------------------------

def general_use_case():
    fig, ax = new_fig(13, 10.8, 'Figure 3.1 - General Use-Case Diagram of SmartDine')

    boundary = patches.FancyBboxPatch((2.2, 0.05), 9.0, 9.35, boxstyle="round,pad=0.02",
                                       facecolor='white', edgecolor='#94a3b8', lw=1.4, linestyle='--')
    ax.add_patch(boundary)
    ax.text(6.7, 9.55, 'SmartDine System', ha='center', va='top', fontsize=10.5,
            fontweight='bold', color='#475569')

    # actors
    draw_actor(ax, 0.9, 8.3, 'Customer')
    draw_actor(ax, 0.9, 5.6, 'Waiter')
    draw_actor(ax, 0.9, 2.9, 'Kitchen\nStaff')
    draw_actor(ax, 12.1, 8.3, 'Cashier')
    draw_actor(ax, 12.1, 5.6, 'Manager')
    draw_actor(ax, 12.1, 2.9, 'Admin')

    uc = {
        'browse':    (4.4, 8.7, 1.9, 0.8, 'Browse Menu &\nPlace Order'),
        'track':     (4.4, 7.4, 1.9, 0.8, 'Track Order\nStatus'),
        'pay':       (4.4, 6.1, 1.9, 0.8, 'Pay Online /\nPay After Eating'),
        'loyalty':   (4.4, 4.8, 1.9, 0.8, 'Earn / Redeem\nLoyalty Points'),
        'callwaiter':(4.4, 3.5, 1.9, 0.8, 'Request Service /\nCall Waiter'),
        'rate':      (4.4, 2.2, 1.9, 0.8, 'Rate Order'),

        'manageorders': (8.9, 8.7, 2.1, 0.8, 'View & Serve\nTable Orders'),
        'collectcash':  (8.9, 7.4, 2.1, 0.8, 'Collect Cash\nPayment'),
        'maketableavail':(8.9, 6.1, 2.1, 0.8, 'Make Table\nAvailable'),
        'prepare':      (8.9, 4.8, 2.1, 0.8, 'Update Order\nPreparation Status'),
        'confirmpay':   (8.9, 3.5, 2.1, 0.8, 'Confirm / Verify\nPayments'),
        'refund':       (8.9, 2.2, 2.1, 0.8, 'Process\nRefunds'),

        'reports':   (6.65, 1.3, 2.1, 0.7, 'View Sales &\nStaff Reports'),
        'manage':    (6.65, 0.5, 2.6, 0.7, 'Manage Menu, Users,\nTables & Promotions'),
    }

    for key, (x, y, w, h, label) in uc.items():
        draw_usecase(ax, x, y, w, h, label)

    # connections - customer
    for k in ['browse', 'track', 'pay', 'loyalty', 'callwaiter', 'rate']:
        connect(ax, (1.2, 8.3 - 0.55), (uc[k][0] - uc[k][2] / 2, uc[k][1]))

    # waiter
    for k in ['manageorders', 'collectcash', 'maketableavail', 'callwaiter']:
        connect(ax, (1.2, 5.6), (uc[k][0] - uc[k][2] / 2 if uc[k][0] > 5 else uc[k][0], uc[k][1]))

    # kitchen
    connect(ax, (1.2, 2.9), (uc['prepare'][0] - uc['prepare'][2] / 2, uc['prepare'][1]))
    connect(ax, (1.2, 2.9), (uc['manageorders'][0] - uc['manageorders'][2] / 2, uc['manageorders'][1] - 0.2))

    # cashier
    for k in ['confirmpay', 'refund', 'collectcash']:
        connect(ax, (11.8, 8.3), (uc[k][0] + uc[k][2] / 2 if uc[k][0] > 5 else uc[k][0], uc[k][1]))

    # manager
    for k in ['reports', 'refund', 'manage']:
        connect(ax, (11.8, 5.6), (uc[k][0] + uc[k][2] / 2, uc[k][1]))

    # admin
    for k in ['manage', 'reports']:
        connect(ax, (11.8, 2.9), (uc[k][0] + uc[k][2] / 2, uc[k][1]))

    plt.tight_layout()
    fig.savefig(OUT + 'usecase_general.png', bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# 2. Partial use-case diagram - Customer
# ---------------------------------------------------------------------------

def usecase_customer():
    fig, ax = new_fig(9, 8.2, 'Figure 3.2 - Partial Use-Case Diagram: Customer')

    boundary = patches.FancyBboxPatch((2.0, 0.3), 6.6, 7.2, boxstyle="round,pad=0.02",
                                       facecolor='white', edgecolor='#94a3b8', lw=1.4, linestyle='--')
    ax.add_patch(boundary)
    ax.text(5.3, 7.65, 'SmartDine - Customer Functions', ha='center', va='top',
            fontsize=10.5, fontweight='bold', color='#475569')

    draw_actor(ax, 0.9, 4.1, 'Customer')

    items = [
        ('Scan Table QR Code', 6.8),
        ('Browse Menu by Category', 5.95),
        ('Add Items & Modifiers to Cart', 5.1),
        ('Apply Promo Code', 4.25),
        ('Redeem Loyalty Points / Reward', 3.4),
        ('Pay Online (Card / Wallet)', 2.55),
        ('Choose Pay-After-Eating', 1.7),
        ('Split the Bill', 0.85),
    ]
    right = [
        ('Track Order & Get Notified When Ready', 6.8),
        ('Request Service (Water, Help, Bill)', 5.95),
        ('Mark "Done Eating" to Free the Table', 5.1),
        ('Rate Completed Order', 4.25),
        ('View Order History & Reorder', 3.4),
        ('Manage Favorites', 2.55),
    ]

    for label, y in items:
        draw_usecase(ax, 4.55, y, 3.0, 0.65, label, fontsize=7.8)
        connect(ax, (1.25, 4.1), (4.55 - 1.5, y))

    plt.tight_layout()
    fig.savefig(OUT + 'usecase_customer.png', bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# 3. Partial use-case diagram - Waiter & Kitchen
# ---------------------------------------------------------------------------

def usecase_staff():
    fig, ax = new_fig(10, 8.2, 'Figure 3.3 - Partial Use-Case Diagram: Waiter & Kitchen Staff')

    boundary = patches.FancyBboxPatch((2.0, 0.3), 6.6, 7.2, boxstyle="round,pad=0.02",
                                       facecolor='white', edgecolor='#94a3b8', lw=1.4, linestyle='--')
    ax.add_patch(boundary)
    ax.text(5.3, 7.65, 'SmartDine - Service & Kitchen Functions', ha='center', va='top',
            fontsize=10.5, fontweight='bold', color='#475569')

    draw_actor(ax, 0.9, 5.2, 'Waiter')
    draw_actor(ax, 0.9, 2.0, 'Kitchen\nStaff')

    waiter_items = [
        ('View Table Map & Status', 6.8),
        ('Create Order for a Guest', 5.95),
        ('View & Resolve Guest Requests', 5.1),
        ('Collect Cash / Card Payment', 4.25),
        ('Confirm Payment Collection', 3.4),
        ('Mark Order Served', 2.55),
        ('Make Table Available', 1.7),
        ('Clock In / Clock Out', 0.85),
    ]
    kitchen_items = [
        ('View Confirmed Orders Queue', 6.8),
        ('Update Item Status (Preparing)', 5.95),
        ('Mark Item / Order Ready', 5.1),
        ('View Estimated Prep Time', 4.25),
        ('Clock In / Clock Out', 3.4),
    ]

    for label, y in waiter_items:
        draw_usecase(ax, 4.55, y, 3.0, 0.65, label, fontsize=7.8)
        connect(ax, (1.25, 5.2), (4.55 - 1.5, y))

    for label, y in kitchen_items:
        draw_usecase(ax, 4.55, y - 0.15, 3.0, 0.55, label, fontsize=7.6)
        connect(ax, (1.25, 2.0), (4.55 - 1.5, y - 0.15))

    plt.tight_layout()
    fig.savefig(OUT + 'usecase_staff.png', bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# 4. Partial use-case diagram - Cashier, Manager, Admin
# ---------------------------------------------------------------------------

def usecase_management():
    fig, ax = new_fig(13.5, 9, 'Figure 3.4 - Partial Use-Case Diagram: Cashier, Manager & Administrator')

    boundary = patches.FancyBboxPatch((2.0, 0.2), 8.7, 7.6, boxstyle="round,pad=0.02",
                                       facecolor='white', edgecolor='#94a3b8', lw=1.4, linestyle='--')
    ax.add_patch(boundary)
    ax.text(6.35, 7.95, 'SmartDine - Management Functions', ha='center', va='top',
            fontsize=10.5, fontweight='bold', color='#475569')

    draw_actor(ax, 0.9, 6.6, 'Cashier')
    draw_actor(ax, 0.9, 2.0, 'Manager')
    draw_actor(ax, 12.6, 4.0, 'Admin')

    col1_items = [
        ('View Pending Payments by Table', 7.1),
        ('Verify Waiter-Collected Cash', 6.25),
        ('Confirm Card / Online Payments', 5.4),
        ('View Per-Table Payment History', 4.55),
        ('Print / View Receipts', 3.7),
        ('Process Refunds with Reason', 2.85),
        ('View Sales & Revenue Dashboard', 2.0),
        ('View Staff Performance & Tips', 1.15),
        ('View Table Occupancy Report', 0.5),
    ]
    col2_items = [
        ('Manage Users & Roles', 7.1),
        ('Manage Menu, Categories & Modifiers', 6.0),
        ('Manage Tables & QR Codes', 4.9),
        ('Manage Promo Codes & Rewards', 3.8),
        ('Manage Inventory & Stock Alerts', 2.7),
        ('View Audit Log', 1.6),
    ]

    for label, y in col1_items:
        draw_usecase(ax, 4.75, y, 3.0, 0.62, label, fontsize=7.6)

    for label, y in col2_items:
        draw_usecase(ax, 9.1, y, 3.1, 0.7, label, fontsize=7.6)

    for label, y in col1_items[:6]:
        connect(ax, (1.25, 6.6), (4.75 - 1.5, y))

    for label, y in col1_items[6:]:
        connect(ax, (1.25, 2.0), (4.75 - 1.5, y))

    for label, y in col2_items:
        connect(ax, (12.45, 4.0), (9.1 + 1.55, y))

    plt.tight_layout()
    fig.savefig(OUT + 'usecase_management.png', bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# 5. Sequence diagram - Order placement & physical-payment confirmation
# ---------------------------------------------------------------------------

def sequence_diagram():
    fig, ax = new_fig(13, 10.5, 'Figure 3.5 - Sequence Diagram: Place Order and Confirm Physical Payment')

    lifelines = [
        ('Customer\n(Browser)', 0.9),
        ('Checkout Page\n(Vue)', 2.7),
        ('Order Controller\n(Express)', 4.9),
        ('Loyalty\nController', 7.0),
        ('Database\n(MariaDB)', 8.9),
        ('Kitchen /\nWaiter UI', 10.7),
        ('Cashier UI', 12.3),
    ]

    top = 8.9
    bottom = 0.5
    for label, x in lifelines:
        draw_box(ax, x - 0.7, top, 1.4, 0.55, label, title_fontsize=8, body_fontsize=8)
        ax.plot([x, x], [top, bottom], '--', color='#94a3b8', lw=1, zorder=1)

    msgs = [
        (0.9, 2.7, 8.35, 'place order (items, points, reward)'),
        (2.7, 4.9, 8.0, 'POST /api/orders'),
        (4.9, 7.0, 7.65, 'validateRewardRedemption()'),
        (4.9, 7.0, 7.3, 'calculateRedemption(reservedPoints)'),
        (4.9, 8.9, 6.95, 'INSERT order, order_items, payment'),
        (4.9, 10.7, 6.6, 'emit "new-order"'),
        (4.9, 2.7, 6.25, '201 Created (order_id, total, points used)'),
        (2.7, 0.9, 5.9, 'show order tracking / receipt'),
        (10.7, 10.7, 5.45, 'kitchen updates item status'),
        (10.7, 2.7, 5.1, 'emit "order-ready"'),
        (10.7, 10.7, 4.6, 'waiter marks order served'),
        (4.9, 12.3, 4.25, 'emit "pending-payment" (post-pay order)'),
        (10.7, 4.9, 3.8, 'waiter confirms cash collected'),
        (4.9, 8.9, 3.45, 'UPDATE payments.waiter_confirmed_by'),
        (4.9, 12.3, 3.1, 'emit "payment-confirmed" (stage=waiter)'),
        (12.3, 4.9, 2.65, 'cashier confirms payment'),
        (4.9, 8.9, 2.3, 'UPDATE payments.status = paid'),
        (4.9, 8.9, 1.95, 'transitionOrderStatus(completed)'),
        (4.9, 12.3, 1.6, 'emit "payment-confirmed"'),
        (12.3, 12.3, 1.1, 'payment moves to table payment history'),
    ]

    xs = {x: x for _, x in lifelines}
    for src, dst, y, label in msgs:
        if src == dst:
            # self message - small loop
            ax.plot([src, src + 0.9, src + 0.9, src], [y + 0.07, y + 0.07, y - 0.07, y - 0.07],
                    '-', color='#1e293b', lw=1.1)
            arrow(ax, (src + 0.9, y - 0.07), (src + 0.05, y - 0.07))
            ax.text(src + 0.15, y + 0.16, label, fontsize=7, ha='left', va='bottom')
        else:
            arrow(ax, (src, y), (dst, y))
            mx = (src + dst) / 2
            ax.text(mx, y + 0.09, label, fontsize=7, ha='center', va='bottom')

    plt.tight_layout()
    fig.savefig(OUT + 'sequence_order_payment.png', bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# 6. Package diagram
# ---------------------------------------------------------------------------

def package_diagram():
    fig, ax = new_fig(11, 8.5, 'Figure 3.6 - Package Diagram of SmartDine')

    # Frontend container
    draw_box(ax, 0.4, 5.3, 5.0, 2.7, ['Frontend (Vue 3 + Vite + Pinia)'], facecolor='#f0f9ff', edgecolor='#0369a1', title_fontsize=10)
    draw_box(ax, 0.7, 6.6, 2.1, 1.0, ['Pages', 'customer / waiter / kitchen', 'cashier / manager / admin'], body_fontsize=7.3)
    draw_box(ax, 2.95, 6.6, 2.1, 1.0, ['Components', 'PendingPaymentsPanel,', 'PaymentHistoryPanel, ...'], body_fontsize=7.3)
    draw_box(ax, 0.7, 5.45, 2.1, 1.0, ['Stores (Pinia)', 'auth, cart, socket,', 'toast, theme'], body_fontsize=7.3)
    draw_box(ax, 2.95, 5.45, 2.1, 1.0, ['Services', 'api.js (Axios),', 'socket.js (Socket.IO)'], body_fontsize=7.3)

    # Backend container
    draw_box(ax, 6.0, 5.3, 4.6, 2.7, ['Backend (Node.js + Express)'], facecolor='#f0fdf4', edgecolor='#15803d', title_fontsize=10)
    draw_box(ax, 6.3, 6.6, 2.0, 1.0, ['Routes', 'order, payment,', 'loyalty, table, ...'], body_fontsize=7.3)
    draw_box(ax, 8.4, 6.6, 1.9, 1.0, ['Middleware', 'auth.js', 'auditLogger.js'], body_fontsize=7.3)
    draw_box(ax, 6.3, 5.45, 2.0, 1.0, ['Controllers', 'orderController,', 'paymentController, ...'], body_fontsize=7.3)
    draw_box(ax, 8.4, 5.45, 1.9, 1.0, ['Services', 'orderWorkflow.js', 'pushService.js'], body_fontsize=7.3)

    # Database container
    draw_box(ax, 3.4, 1.2, 4.0, 2.5, ['Database (MariaDB)', 'smart_restaurant schema:', 'users, orders, payments,', 'menu_items, loyalty_points,', 'restaurant_tables, ...'],
             facecolor='#fef2f2', edgecolor='#b91c1c', body_fontsize=8)

    # Realtime
    draw_box(ax, 8.1, 1.2, 2.5, 1.3, ['Real-time Layer', 'Socket.IO events'], facecolor='#fefce8', edgecolor='#a16207', body_fontsize=8)

    # connections
    arrow(ax, (2.95, 6.0), (2.95, 5.45 + 1.0))  # within frontend (visual only)
    arrow(ax, (5.4, 6.5), (6.0, 6.5), color='#1e293b')
    ax.text(5.7, 6.65, 'REST API\n(HTTPS/JSON)', fontsize=7.3, ha='center')

    arrow(ax, (7.3, 5.45), (5.5, 2.4))
    arrow(ax, (5.5, 2.4), (7.3, 5.45))
    ax.text(6.4, 4.0, 'SQL\n(mysql2)', fontsize=7.3, ha='center', rotation=35)

    arrow(ax, (9.3, 2.5), (9.3, 5.3))
    ax.text(9.75, 3.9, 'emit /\nbroadcast', fontsize=7.3, ha='center')

    arrow(ax, (2.0, 5.3), (8.5, 2.45))
    ax.text(4.0, 3.6, 'WebSocket (live updates)', fontsize=7.3, ha='center', rotation=-18,
            bbox=dict(boxstyle='round,pad=0.1', fc='white', ec='none'))

    plt.tight_layout()
    fig.savefig(OUT + 'package_diagram.png', bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# 7. Class diagram (simplified domain model)
# ---------------------------------------------------------------------------

def class_diagram():
    fig, ax = new_fig(13, 10.3, 'Figure 3.8 - Simplified Design Class Diagram')

    classes = {
        'User': (0.4, 7.6, 2.6, 1.7, ['User', '- id: int', '- name, email', '- role: enum', '- password: hash']),
        'RestaurantTable': (3.4, 7.6, 2.7, 1.7, ['RestaurantTable', '- id: int', '- table_number', '- status: enum', '- qr_token']),
        'TableSession': (6.5, 7.6, 2.6, 1.7, ['TableSession', '- id: int', '- table_id', '- status: enum', '- started/ended_at']),
        'MenuCategory': (9.5, 7.6, 2.6, 1.7, ['MenuCategory', '- id: int', '- name', '- description']),

        'MenuItem': (9.5, 5.3, 2.6, 1.9, ['MenuItem', '- id: int', '- category_id', '- name, price', '- prep_time_minutes', '- dietary_tags']),
        'MenuItemModifier': (9.5, 3.0, 2.6, 1.5, ['MenuItemModifier', '- id: int', '- menu_item_id', '- name, price_delta']),

        'Order': (3.4, 5.0, 2.7, 2.0, ['Order', '- id: int', '- table_id, session_id', '- status: enum', '- total, discount_amount', '- payment_type']),
        'OrderItem': (6.5, 5.0, 2.6, 2.0, ['OrderItem', '- id: int', '- order_id, menu_item_id', '- quantity, price', '- status: enum', '- modifiers (JSON)']),

        'Payment': (0.4, 5.0, 2.7, 2.3, ['Payment', '- id: int', '- order_id, amount', '- method, status', '- payment_timing', '- cashier_confirmed', '- waiter_confirmed_by']),

        'LoyaltyPoint': (0.4, 2.0, 2.7, 1.7, ['LoyaltyPoint', '- id: int', '- user_id / session_id', '- points, type', '- order_id']),
        'LoyaltyReward': (3.4, 2.0, 2.7, 1.7, ['LoyaltyReward', '- id: int', '- name, points_cost', '- menu_item_id']),
        'PromoCode': (6.5, 2.0, 2.6, 1.7, ['PromoCode', '- id: int', '- code, discount_type', '- discount_value']),
    }

    for name, (x, y, w, h, lines) in classes.items():
        draw_box(ax, x, y, w, h, lines, body_fontsize=7.8, title_fontsize=9)

    def edge(a, b, label, ay_off=0, by_off=0, ax_off=0, bx_off=0):
        ax1, ay1, aw, ah, _ = classes[a]
        bx1, by1, bw, bh, _ = classes[b]
        p1 = (ax1 + aw / 2 + ax_off, ay1 + ah / 2 + ay_off)
        p2 = (bx1 + bw / 2 + bx_off, by1 + bh / 2 + by_off)
        connect(ax, p1, p2, label=label)

    edge('RestaurantTable', 'TableSession', '1..*')
    edge('TableSession', 'Order', '0..*', ax_off=-0.5, bx_off=0.5)
    edge('RestaurantTable', 'Order', '1..*', ax_off=0.5, by_off=0.9)
    edge('Order', 'OrderItem', '1..*')
    edge('MenuItem', 'OrderItem', '1..*', by_off=0.4, ay_off=-0.4)
    edge('MenuItem', 'MenuItemModifier', '1..*')
    edge('MenuCategory', 'MenuItem', '1..*')
    edge('Order', 'Payment', '1..*', ax_off=-0.8)
    edge('User', 'Payment', '0..*  confirms', ax_off=-0.8, ay_off=-0.6)
    edge('User', 'Order', '0..1  places', ax_off=0.8)
    edge('Order', 'LoyaltyPoint', '0..*', ax_off=-0.8, by_off=0.5)
    edge('User', 'LoyaltyPoint', '0..*  earns')
    edge('LoyaltyReward', 'MenuItem', '0..1', ay_off=0.4)
    edge('PromoCode', 'Order', '0..*  applies to', bx_off=-0.5)

    plt.tight_layout()
    fig.savefig(OUT + 'class_diagram.png', bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# 8. ER Diagram (core entities)
# ---------------------------------------------------------------------------

def er_diagram():
    fig, ax = new_fig(13, 10.8, 'Figure 3.7 - Logical ER Diagram of the Core SmartDine Schema')

    entities = {
        'users': (0.3, 8.2, 2.5, 1.6, ['users', 'PK id', 'name, email, password', 'role, is_active']),
        'restaurant_tables': (3.2, 8.2, 2.7, 1.6, ['restaurant_tables', 'PK id', 'table_number, capacity', 'status, qr_token', 'FK waiter_id -> users']),
        'table_sessions': (6.3, 8.2, 2.6, 1.6, ['table_sessions', 'PK id', 'FK table_id -> restaurant_tables', 'status, started/ended_at']),

        'menu_categories': (9.3, 8.2, 2.5, 1.4, ['menu_categories', 'PK id', 'name, description']),
        'menu_items': (9.3, 5.9, 2.6, 1.9, ['menu_items', 'PK id', 'FK category_id', 'name, price, stock_quantity', 'prep_time_minutes, dietary_tags']),
        'menu_item_modifiers': (9.3, 3.6, 2.6, 1.5, ['menu_item_modifiers', 'PK id', 'FK menu_item_id', 'name, price_delta']),

        'orders': (3.2, 5.6, 2.9, 2.3, ['orders', 'PK id', 'FK table_id, session_id', 'FK customer_id -> users', 'FK promo_code_id', 'status, total, discount_amount', 'payment_type']),
        'order_items': (6.4, 5.6, 2.6, 2.0, ['order_items', 'PK id', 'FK order_id, menu_item_id', 'quantity, price, status', 'modifiers, modifier_total']),

        'payments': (0.3, 5.3, 2.7, 2.6, ['payments', 'PK id', 'FK order_id', 'amount, method, status', 'payment_timing, split_type', 'cashier_confirmed', 'waiter_confirmed_by -> users']),

        'loyalty_points': (0.3, 2.2, 2.7, 1.9, ['loyalty_points', 'PK id', 'FK user_id / session_id', 'FK order_id', 'points, type']),
        'loyalty_rewards': (3.2, 2.2, 2.7, 1.7, ['loyalty_rewards', 'PK id', 'FK menu_item_id', 'name, points_cost']),
        'promo_codes': (6.2, 2.2, 2.7, 1.7, ['promo_codes', 'PK id', 'code, discount_type', 'discount_value, max_uses']),
    }

    for name, (x, y, w, h, lines) in entities.items():
        draw_box(ax, x, y, w, h, lines, body_fontsize=7.6, title_fontsize=9, facecolor='#fffbeb', edgecolor='#b45309')

    def edge(a, b, label, ax_off=0, ay_off=0, bx_off=0, by_off=0):
        ax1, ay1, aw, ah, _ = entities[a]
        bx1, by1, bw, bh, _ = entities[b]
        p1 = (ax1 + aw / 2 + ax_off, ay1 + ah / 2 + ay_off)
        p2 = (bx1 + bw / 2 + bx_off, by1 + bh / 2 + by_off)
        connect(ax, p1, p2, label=label, color='#92400e')

    edge('restaurant_tables', 'users', '0..*  waiter  1', ay_off=0.4, by_off=-0.4)
    edge('table_sessions', 'restaurant_tables', '1..*  1')
    edge('orders', 'table_sessions', '0..*  1', ax_off=0.6, ay_off=0.7, bx_off=-0.6, by_off=-0.4)
    edge('orders', 'restaurant_tables', '1..*  1', ay_off=1.0, by_off=-0.3, ax_off=-0.6)
    edge('orders', 'users', '0..*  1  customer', ax_off=-0.6, ay_off=-0.9, bx_off=0.6, by_off=-0.6)
    edge('orders', 'promo_codes', '0..*  0..1', ax_off=0.4, by_off=0.5)
    edge('order_items', 'orders', '1..*  1')
    edge('order_items', 'menu_items', '1..*  1', bx_off=-0.4)
    edge('menu_items', 'menu_categories', '1..*  1')
    edge('menu_item_modifiers', 'menu_items', '1..*  1')
    edge('payments', 'orders', '1..*  1', ax_off=0.6, by_off=-0.4)
    edge('payments', 'users', '0..*  1  confirmed_by', ay_off=0.9, bx_off=-0.6, by_off=-0.9)
    edge('loyalty_points', 'orders', '0..*  0..1', ax_off=0.8, ay_off=1.2, bx_off=-1.0, by_off=-1.0)
    edge('loyalty_points', 'users', '0..*  0..1')
    edge('loyalty_rewards', 'menu_items', '0..*  0..1', ay_off=0.7, bx_off=-0.5, by_off=-0.8)

    plt.tight_layout()
    fig.savefig(OUT + 'er_diagram.png', bbox_inches='tight')
    plt.close(fig)


if __name__ == '__main__':
    general_use_case()
    usecase_customer()
    usecase_staff()
    usecase_management()
    sequence_diagram()
    package_diagram()
    class_diagram()
    er_diagram()
    print('done')
