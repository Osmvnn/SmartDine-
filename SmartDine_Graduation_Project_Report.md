# SmartDine Restaurant Management System

## Project Overview

SmartDine is a restaurant management system designed to connect customers, waiters, kitchen staff, cashiers, managers, and administrators in one clear workflow. The project focuses on real restaurant operations: table service, QR ordering, staff ordering, kitchen preparation, payment confirmation, shift tracking, sales reporting, and customer loyalty.

The system was built to reduce mistakes between the dining area, kitchen, and cashier desk. Each role has its own screen and responsibilities, so orders and payments move through the restaurant in a logical order instead of depending on manual communication.

## Project Objectives

The main goal of the project is to create a complete restaurant workflow that is easy to understand and practical to use. The system supports customer self-ordering through a table QR code, waiter ordering for guests, kitchen order handling, cashier payment verification, and manager reports based only on paid sales.

The project also aims to make daily restaurant work easier by tracking table status, employee shifts, payment history, receipts, reservations, loyalty rewards, and available menu items.

## Main Users

The customer can browse the menu, add items to the cart, use offers or loyalty points, choose online or physical payment, and track the order after it is placed.

The waiter can view ready orders, serve customers, handle guest requests, collect physical payments, create orders for guests, and make a table available when the guest leaves without ending the session.

The kitchen user can view confirmed orders, update item preparation status, and mark orders as ready.

The cashier can confirm cash or card payments after the waiter collects the money, view receipts, refund payments, and review paid payment history by table and order.

The manager can review restaurant performance using confirmed paid sales only, which keeps the reports accurate.

The administrator can manage users, roles, menu items, tables, reservations, categories, and restaurant setup.

## System Workflow

The customer starts from a table QR code or a table link. If the customer is logged in, the system can connect loyalty points and customer history. If the customer is not logged in, the guest can still place an order for the table.

When an order is created, the table becomes occupied and an active table session is created if one does not already exist. The order is then linked to the table and session.

If the payment is online, the customer pays before the kitchen starts the order. After successful payment, the order becomes confirmed and goes to the kitchen.

If the payment is physical, such as cash or card at the restaurant, the order can still be confirmed for preparation, but the payment remains pending. After the guest eats, the waiter collects the money and the cashier verifies it. Only after cashier confirmation is the payment treated as paid.

## Payment Logic

The payment flow is separated into two main types:

1. Online payment: the customer pays before the order is prepared. Tips can be added during checkout, and the order moves forward after payment.
2. Physical payment: the customer pays after eating. The waiter collects the payment, the cashier verifies it, and the receipt remains available in cashier history.

This makes the cashier role important because paid sales are not counted only because an order exists. Sales are counted after the payment is confirmed.

The system also supports loyalty points and rewards. If points or rewards cover the whole order amount, the order is handled as a no-charge paid order instead of waiting for a normal cash or card payment.

## Menu And Data

The menu data was expanded to include more categories and items, including appetizers, main courses, drinks, desserts, breakfast, pizza, seafood, and healthy bowls. Menu items also include preparation time, dietary tags, stock values, and optional modifiers such as extra cheese, sauces, milk alternatives, and add-ons.

This gives the project enough data to look realistic during testing and presentation.

## Table And Shift Handling

Tables can be occupied, reserved, or available. If a customer forgets to end the dining session, the waiter can make the table available after active orders are completed or cancelled. This prevents tables from staying blocked forever.

Employee shifts support clock in and clock out. The clock-out flow was adjusted so it works even when no note is sent from the interface.

## Currency And Language

The customer and payment screens support USD and TRY display. The application now stays focused on one English interface.

## Database Summary

The database stores users, tables, table sessions, menu categories, menu items, modifiers, orders, order items, payments, payment history, loyalty points, loyalty rewards, reservations, shifts, ratings, favorites, audit records, and notifications.

The database was updated to include cashier role support, payment timing, cashier confirmation, waiter collection confirmation, tips, refunds, menu modifiers, loyalty rewards, and richer menu fields.

## Testing Summary

The project was checked by building the frontend and checking the backend controller files. The database migration and seed process were also run so the live database includes the updated schema and sample data.

The most important flows checked were:

1. Customer checkout with online payment.
2. Customer checkout with physical payment.
3. Reward and points payment when the order total becomes zero.
4. Waiter payment collection.
5. Cashier payment verification.
6. Cashier payment history and receipt access.
7. Clock out from staff dashboards.
8. Cashier role availability in admin user management.
9. Waiter table release after guests leave.

## Conclusion

SmartDine is a complete restaurant management project that covers the main daily operations of a modern restaurant. The system keeps each role focused, makes payments easier to control, gives management accurate sales information, and improves the customer ordering experience through QR ordering, loyalty points, and clear payment choices.

The project is suitable as a graduation project because it includes a real business problem, multiple user roles, a connected database, live operational workflows, and practical features that can be demonstrated from customer ordering to cashier payment confirmation.
