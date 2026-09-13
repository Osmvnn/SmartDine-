-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 14, 2026 at 07:36 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `smart_restaurant`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_log`
--

INSERT INTO `audit_log` (`id`, `user_id`, `user_name`, `action`, `entity_type`, `entity_id`, `details`, `created_at`) VALUES
(6, 1, 'Admin User', 'create', 'table', 13, '{\"table_number\":32,\"capacity\":4,\"status\":\"available\"}', '2026-06-11 15:41:31'),
(7, 1, 'Admin User', 'update', 'table', 2, '{\"waiter_id\":null}', '2026-06-11 17:17:39'),
(8, 1, 'Admin User', 'update', 'table', 5, '{\"waiter_id\":null}', '2026-06-11 17:17:47'),
(9, 1, 'Admin User', 'update', 'table', 10, '{\"waiter_id\":4}', '2026-06-11 17:17:51'),
(10, 1, 'Admin User', 'update', 'table', 1, '{\"waiter_id\":4}', '2026-06-11 17:38:54'),
(11, NULL, 'Manager User', 'update', 'reservation', 3, '{\"status\":\"confirmed\"}', '2026-06-11 17:54:47'),
(12, NULL, 'Manager User', 'update', 'reservation', 3, '{\"status\":\"completed\"}', '2026-06-11 17:54:55'),
(13, 1, 'Admin User', 'delete', 'user', 2, NULL, '2026-06-11 18:06:40'),
(14, 1, 'Admin User', 'delete', 'user', 4, NULL, '2026-06-11 18:06:42'),
(15, 1, 'Admin User', 'delete', 'user', 5, NULL, '2026-06-11 18:06:45'),
(16, 1, 'Admin User', 'delete', 'user', 6, NULL, '2026-06-11 18:06:47'),
(17, 1, 'Admin User', 'delete', 'user', 7, NULL, '2026-06-11 18:06:49'),
(18, 1, 'Admin User', 'delete', 'user', 13, NULL, '2026-06-11 18:06:51'),
(19, 1, 'Admin User', 'delete', 'user', 3, NULL, '2026-06-11 18:06:53'),
(20, 1, 'Admin User', 'create', 'user', 14, '{\"name\":\"MAHJOUB\",\"email\":\"mahjoub@gmail.com\",\"role\":\"customer\",\"is_active\":true}', '2026-06-11 18:07:10'),
(21, 1, 'Admin User', 'create', 'user', 15, '{\"name\":\"SAIF\",\"email\":\"saif@gmail.com\",\"role\":\"waiter\",\"is_active\":true}', '2026-06-11 18:07:39'),
(22, 1, 'Admin User', 'create', 'user', 16, '{\"name\":\"MALEK\",\"email\":\"malek@gmail.com\",\"role\":\"kitchen\",\"is_active\":true}', '2026-06-11 18:07:59'),
(23, 1, 'Admin User', 'create', 'user', 17, '{\"name\":\"OSMAN\",\"email\":\"osman@smart.com\",\"role\":\"manager\",\"is_active\":true}', '2026-06-11 18:08:18'),
(24, 1, 'Admin User', 'create', 'user', 18, '{\"name\":\"saifcash\",\"email\":\"saifcash@gmail.com\",\"role\":\"cashier\",\"is_active\":true}', '2026-06-11 18:09:06'),
(25, 1, 'Admin User', 'update', 'table', 2, '{\"waiter_id\":15}', '2026-06-11 18:20:19'),
(26, 1, 'Admin User', 'update', 'table', 1, '{\"waiter_id\":15}', '2026-06-11 18:21:59'),
(27, 1, 'Admin User', 'update', 'table', 8, '{\"waiter_id\":15}', '2026-06-11 18:22:05'),
(28, 18, 'saifcash', 'refund', 'payment', 78, '{\"reason\":\"other\",\"notes\":\"\"}', '2026-06-11 18:27:35'),
(29, 1, 'Admin User', 'update', 'table', 1, '{\"waiter_id\":15}', '2026-06-11 18:39:08'),
(30, 1, 'Admin User', 'create', 'table', 24, '{\"table_number\":12,\"capacity\":4,\"status\":\"available\"}', '2026-06-11 18:39:50'),
(31, 18, 'saifcash', 'refund', 'payment', 85, '{\"reason\":\"order_cancelled\",\"notes\":\"\"}', '2026-06-11 18:56:25'),
(32, 17, 'OSMAN', 'update', 'reservation', 4, '{\"status\":\"confirmed\"}', '2026-06-11 19:02:01'),
(33, 17, 'OSMAN', 'update', 'reservation', 4, '{\"status\":\"no_show\"}', '2026-06-11 19:02:10'),
(34, 1, 'Admin User', 'update', 'table', 1, '{\"waiter_id\":15}', '2026-06-11 19:07:05'),
(35, 1, 'Admin User', 'create', 'table', 25, '{\"table_number\":13,\"capacity\":-1,\"status\":\"available\"}', '2026-06-11 19:07:34'),
(36, 1, 'Admin User', 'create', 'table', 36, '{\"table_number\":35,\"capacity\":4,\"status\":\"available\"}', '2026-06-14 17:03:22');

-- --------------------------------------------------------

--
-- Table structure for table `blocked_ips`
--

CREATE TABLE `blocked_ips` (
  `id` int(11) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `blocked_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `menu_item_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`id`, `session_id`, `menu_item_id`, `created_at`) VALUES
(6, 4, 1, '2026-06-11 16:09:27'),
(7, 1, 1, '2026-06-11 17:31:28'),
(8, 1, 2, '2026-06-11 17:31:28');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_items`
--

CREATE TABLE `inventory_items` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` varchar(100) DEFAULT 'General',
  `unit` varchar(50) DEFAULT 'pcs',
  `quantity` decimal(10,2) DEFAULT 0.00,
  `min_quantity` decimal(10,2) DEFAULT 5.00,
  `cost_per_unit` decimal(10,2) DEFAULT 0.00,
  `supplier` varchar(150) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `last_restocked` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_items`
--

INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `quantity`, `min_quantity`, `cost_per_unit`, `supplier`, `notes`, `last_restocked`, `created_at`) VALUES
(1, 'Chicken Breast', 'Meat', 'kg', 25.00, 5.00, 6.50, 'Fresh Farms Co.', NULL, NULL, '2026-06-10 03:15:21'),
(2, 'Romaine Lettuce', 'Produce', 'kg', 12.00, 3.00, 1.80, 'Green Valley Produce', NULL, NULL, '2026-06-10 03:15:21'),
(3, 'Beef Tenderloin', 'Meat', 'kg', 8.00, 2.00, 18.00, 'Fresh Farms Co.', NULL, NULL, '2026-06-10 03:15:21'),
(4, 'Mozzarella Cheese', 'Dairy', 'kg', 10.00, 2.00, 7.20, 'Dairy Best', NULL, NULL, '2026-06-10 03:15:21'),
(5, 'Spaghetti Pasta', 'Dry Goods', 'kg', 20.00, 5.00, 2.10, 'Italian Imports', NULL, NULL, '2026-06-10 03:15:21'),
(6, 'Cooking Oil', 'Pantry', 'liter', 15.00, 4.00, 3.50, 'Wholesale Foods', NULL, NULL, '2026-06-10 03:15:21'),
(7, 'Coffee Beans', 'Beverage', 'kg', 6.00, 2.00, 14.00, 'Roast Masters', NULL, NULL, '2026-06-10 03:15:21'),
(8, 'Soft Drink Syrup', 'Beverage', 'liter', 4.00, 2.00, 9.00, 'Beverage Supply Inc.', NULL, NULL, '2026-06-10 03:15:21');

-- --------------------------------------------------------

--
-- Table structure for table `loyalty_points`
--

CREATE TABLE `loyalty_points` (
  `id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `points` int(11) NOT NULL,
  `type` enum('earned','redeemed') NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loyalty_points`
--

INSERT INTO `loyalty_points` (`id`, `session_id`, `user_id`, `points`, `type`, `order_id`, `description`, `created_at`) VALUES
(1, 1, NULL, 109, 'earned', 1, 'Earned from order #1', '2026-06-10 03:15:37'),
(2, 2, NULL, 69, 'earned', NULL, 'Earned from order #2', '2026-06-10 03:19:25'),
(3, 2, NULL, 159, 'earned', NULL, 'Earned from order #3', '2026-06-10 03:31:38'),
(4, 2, NULL, 179, 'earned', NULL, 'Earned from order #4', '2026-06-10 03:47:54'),
(5, 3, NULL, 89, 'earned', 5, 'Earned from order #5', '2026-06-10 13:39:25'),
(6, 4, NULL, 109, 'earned', 6, 'Earned from order #6', '2026-06-10 14:40:10'),
(7, 3, NULL, 239, 'earned', 7, 'Earned from order #7', '2026-06-10 14:50:53'),
(8, 3, NULL, 239, 'earned', 8, 'Earned from order #8', '2026-06-10 14:57:59'),
(9, 3, NULL, 239, 'earned', 9, 'Earned from order #9', '2026-06-10 14:58:37'),
(10, 4, NULL, 109, 'earned', 10, 'Earned from order #10', '2026-06-10 14:59:49'),
(11, 4, NULL, 139, 'earned', 11, 'Earned from order #11', '2026-06-10 15:02:14'),
(12, 4, NULL, 89, 'earned', 12, 'Earned from order #12', '2026-06-10 15:28:54'),
(13, 4, NULL, 89, 'earned', 13, 'Earned from order #13', '2026-06-10 15:30:46'),
(14, 4, NULL, 109, 'earned', NULL, 'Earned from order #14', '2026-06-10 15:40:55'),
(15, 5, NULL, 89, 'earned', 15, 'Earned from order #15', '2026-06-10 15:58:59'),
(16, 6, NULL, 89, 'earned', 16, 'Earned from order #16', '2026-06-10 16:01:36'),
(17, 4, NULL, 89, 'earned', 17, 'Earned from order #17', '2026-06-10 16:35:25'),
(18, 7, 1, 169, 'earned', NULL, 'Earned from order #18', '2026-06-10 16:54:45'),
(19, 4, NULL, 109, 'earned', 19, 'Earned from order #19', '2026-06-10 16:59:35'),
(20, 7, NULL, 109, 'earned', NULL, 'Earned from order #20', '2026-06-10 16:59:46'),
(21, 3, NULL, 89, 'redeemed', 21, 'Redeemed 89 points for $8.90 discount on order #21', '2026-06-10 22:26:00'),
(22, 3, NULL, 89, 'earned', NULL, 'Earned from order #22', '2026-06-10 22:32:29'),
(23, 3, NULL, 359, 'earned', NULL, 'Earned from order #23', '2026-06-10 22:49:02'),
(24, 4, NULL, 149, 'earned', NULL, 'Earned from order #24', '2026-06-10 23:13:50'),
(25, 4, NULL, 149, 'earned', NULL, 'Earned from order #25', '2026-06-10 23:15:04'),
(26, 4, NULL, 149, 'earned', NULL, 'Earned from order #26', '2026-06-10 23:20:19'),
(27, 3, NULL, 209, 'earned', NULL, 'Earned from order #27', '2026-06-10 23:51:03'),
(28, 3, NULL, 209, 'earned', NULL, 'Earned from order #28', '2026-06-10 23:51:17'),
(31, 8, 1, 189, 'earned', 31, 'Earned from order #31', '2026-06-11 13:49:29'),
(32, 9, NULL, 109, 'earned', NULL, 'Earned from order #32', '2026-06-11 13:52:22'),
(33, 2, 1, 109, 'earned', NULL, 'Earned from order #33', '2026-06-11 14:15:28'),
(34, 10, NULL, 219, 'earned', NULL, 'Earned from order #36', '2026-06-11 15:10:54'),
(35, 4, 1, 169, 'earned', 37, 'Earned from order #37', '2026-06-11 15:46:59'),
(36, 11, 1, 59, 'redeemed', NULL, 'Redeemed 59 points for $5.90 discount on order #38', '2026-06-11 16:08:36'),
(37, 11, 1, 89, 'earned', NULL, 'Earned from order #39', '2026-06-11 16:18:23'),
(38, 7, 1, 549, 'earned', NULL, 'Earned from order #40', '2026-06-11 16:43:05'),
(39, 12, NULL, 219, 'earned', NULL, 'Earned from order #41', '2026-06-11 16:57:37'),
(40, 12, NULL, 80, 'redeemed', NULL, 'Redeemed 80 points for free Free Mineral Water on order #42', '2026-06-11 17:14:52'),
(41, 12, NULL, 199, 'earned', NULL, 'Earned from order #43', '2026-06-11 17:15:27'),
(42, 13, NULL, 109, 'earned', NULL, 'Earned from order #44', '2026-06-11 17:16:44'),
(43, 3, 1, 179, 'earned', 45, 'Earned from order #45', '2026-06-11 17:34:07'),
(44, 3, NULL, 109, 'earned', NULL, 'Earned from order #46', '2026-06-11 17:41:08'),
(45, 12, NULL, 89, 'earned', NULL, 'Earned from order #47', '2026-06-11 17:45:02'),
(46, 4, 14, 289, 'earned', 48, 'Earned from order #48', '2026-06-11 18:14:43'),
(47, 3, 15, 44, 'earned', NULL, 'Earned from order #49', '2026-06-11 18:24:41'),
(48, 14, 18, 199, 'earned', NULL, 'Earned from order #50', '2026-06-11 18:27:08'),
(49, 3, 14, 20, 'redeemed', 51, 'Redeemed 20 points for $2.00 discount on order #51', '2026-06-11 18:50:05'),
(50, 3, 14, 193, 'earned', 51, 'Earned from order #51', '2026-06-11 18:50:05'),
(51, 3, 15, 109, 'earned', NULL, 'Earned from order #52', '2026-06-11 18:57:26'),
(52, 15, NULL, 89, 'earned', NULL, 'Earned from order #53', '2026-06-12 00:58:48'),
(53, 15, NULL, 89, 'earned', NULL, 'Earned from order #54', '2026-06-12 01:02:46'),
(54, 16, 14, 109, 'earned', 55, 'Earned from order #55', '2026-06-12 01:05:05');

-- --------------------------------------------------------

--
-- Table structure for table `loyalty_rewards`
--

CREATE TABLE `loyalty_rewards` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `points_cost` int(11) NOT NULL,
  `menu_item_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loyalty_rewards`
--

INSERT INTO `loyalty_rewards` (`id`, `name`, `description`, `points_cost`, `menu_item_id`, `is_active`, `created_at`) VALUES
(1, 'Free Mineral Water', 'Redeem points for a bottle of mineral water', 80, 16, 1, '2026-06-11 15:58:23'),
(2, 'Free Dessert', 'Choose a dessert reward with your meal', 250, 39, 1, '2026-06-11 15:58:23'),
(3, 'Free Coffee', 'Enjoy Turkish coffee with points', 120, 38, 1, '2026-06-11 15:58:23');

-- --------------------------------------------------------

--
-- Table structure for table `menu_categories`
--

CREATE TABLE `menu_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_categories`
--

INSERT INTO `menu_categories` (`id`, `name`, `description`, `image_url`, `created_at`) VALUES
(1, 'Appetizers', 'Start your meal with our delicious appetizers', '/images/appetizers.svg', '2026-06-10 03:15:21'),
(2, 'Main Course', 'Hearty and satisfying main dishes', '/images/main-course.svg', '2026-06-10 03:15:21'),
(3, 'Drinks', 'Refreshing beverages for every taste', '/images/drinks.svg', '2026-06-10 03:15:21'),
(4, 'Desserts', 'Sweet endings to complete your meal', '/images/desserts.svg', '2026-06-10 03:15:21'),
(5, 'Breakfast', 'Fresh morning plates and bakery favorites', '/images/main-course.svg', '2026-06-11 15:58:23'),
(6, 'Pizza', 'Stone-baked pizzas with classic toppings', '/images/main-course.svg', '2026-06-11 15:58:23'),
(7, 'Seafood', 'Fresh fish and seafood dishes', '/images/main-course.svg', '2026-06-11 15:58:23'),
(8, 'Healthy Bowls', 'Balanced bowls, salads, and lighter meals', '/images/main-course.svg', '2026-06-11 15:58:23');

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `stock_quantity` int(11) DEFAULT -1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `prep_time_minutes` int(11) DEFAULT 15,
  `dietary_tags` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`id`, `category_id`, `name`, `description`, `price`, `image_url`, `is_available`, `stock_quantity`, `created_at`, `prep_time_minutes`, `dietary_tags`) VALUES
(1, 1, 'Caesar Salad', 'Fresh romaine lettuce with parmesan and caesar dressing', 8.99, '/images/menu/1.jpg', 1, 25, '2026-06-10 03:15:21', 15, 'vegetarian,gluten-free'),
(2, 1, 'Chicken Wings', 'Crispy buffalo wings served with ranch dip', 10.99, '/images/menu/2.jpg', 1, 18, '2026-06-10 03:15:21', 15, NULL),
(3, 1, 'Garlic Bread', 'Toasted artisan bread with garlic butter', 5.99, '/images/menu/3.jpg', 1, 40, '2026-06-10 03:15:21', 15, NULL),
(4, 1, 'Soup of the Day', 'Chef special daily soup with bread', 6.99, '/images/menu/4.jpg', 1, 20, '2026-06-10 03:15:21', 15, NULL),
(5, 1, 'Spring Rolls', 'Crispy vegetable spring rolls with sweet chili sauce', 7.99, '/images/menu/5.jpg', 1, 30, '2026-06-10 03:15:21', 15, NULL),
(6, 2, 'Grilled Chicken', 'Herb-marinated grilled chicken breast with vegetables', 15.99, '/images/menu/6.jpg', 1, 22, '2026-06-10 03:15:21', 15, NULL),
(7, 2, 'Beef Steak', 'Premium beef steak cooked to perfection with sides', 22.99, '/images/menu/7.jpg', 1, 15, '2026-06-10 03:15:21', 15, NULL),
(8, 2, 'Pasta Carbonara', 'Creamy Italian pasta with crispy bacon', 13.99, '/images/menu/8.jpg', 1, 28, '2026-06-10 03:15:21', 15, NULL),
(9, 2, 'Fish & Chips', 'Golden battered cod with seasoned fries', 14.99, '/images/menu/9.jpg', 1, 3, '2026-06-10 03:15:21', 15, NULL),
(10, 2, 'Veggie Burger', 'Plant-based burger with fresh toppings', 12.99, '/images/menu/10.jpg', 1, 24, '2026-06-10 03:15:21', 15, NULL),
(11, 2, 'Lamb Chops', 'Tender grilled lamb chops with mint sauce', 24.99, '/images/menu/11.jpg', 1, 0, '2026-06-10 03:15:21', 15, NULL),
(12, 3, 'Fresh Orange Juice', 'Freshly squeezed orange juice', 4.99, '/images/menu/12.jpg', 1, 40, '2026-06-10 03:15:21', 15, NULL),
(13, 3, 'Soft Drink', 'Coca-Cola, Sprite, or Fanta', 2.99, '/images/menu/13.jpg', 1, 80, '2026-06-10 03:15:21', 15, NULL),
(14, 3, 'Cappuccino', 'Italian style cappuccino', 4.49, '/images/menu/14.jpg', 1, 50, '2026-06-10 03:15:21', 15, NULL),
(15, 3, 'Iced Tea', 'Refreshing lemon iced tea', 3.49, '/images/menu/15.jpg', 1, 45, '2026-06-10 03:15:21', 15, NULL),
(16, 3, 'Mineral Water', 'Still or sparkling mineral water', 1.99, '/images/menu/16.jpg', 1, 100, '2026-06-10 03:15:21', 15, NULL),
(17, 4, 'Chocolate Lava Cake', 'Rich chocolate cake with molten center', 8.99, '/images/menu/17.jpg', 1, 20, '2026-06-10 03:15:21', 15, NULL),
(18, 4, 'Ice Cream Sundae', 'Three scoops with toppings and whipped cream', 6.99, '/images/menu/18.jpg', 1, 35, '2026-06-10 03:15:21', 15, NULL),
(19, 4, 'New York Cheesecake', 'Classic New York style cheesecake', 7.99, '/images/menu/19.jpg', 1, 4, '2026-06-10 03:15:21', 15, NULL),
(20, 4, 'Tiramisu', 'Traditional Italian tiramisu', 8.49, '/images/menu/20.jpg', 1, 16, '2026-06-10 03:15:21', 15, NULL),
(21, 5, 'Turkish Breakfast Plate', 'Eggs, cheese, olives, tomato, cucumber, honey, and bread', 12.50, '/images/menu/21.jpg', 1, 14, '2026-06-11 15:58:23', 12, 'vegetarian'),
(22, 5, 'Avocado Toast', 'Sourdough toast with avocado, herbs, and poached egg', 9.90, '/images/menu/22.jpg', 1, 20, '2026-06-11 15:58:23', 10, 'vegetarian'),
(23, 5, 'Omelette', 'Three-egg omelette with cheese and herbs', 8.50, '/images/menu/23.jpg', 1, 30, '2026-06-11 15:58:23', 8, 'vegetarian,gluten-free'),
(24, 5, 'Pancake Stack', 'Fluffy pancakes with maple syrup and berries', 8.75, '/images/menu/24.jpg', 1, 25, '2026-06-11 15:58:23', 10, 'vegetarian'),
(25, 6, 'Margherita Pizza', 'Tomato sauce, mozzarella, and basil', 11.99, '/images/menu/25.jpg', 1, 26, '2026-06-11 15:58:23', 15, 'vegetarian'),
(26, 6, 'Pepperoni Pizza', 'Mozzarella, pepperoni, and oregano', 13.99, '/images/menu/26.jpg', 1, 22, '2026-06-11 15:58:23', 16, ''),
(27, 6, 'Chicken BBQ Pizza', 'BBQ sauce, chicken, onion, and mozzarella', 14.99, '/images/menu/27.jpg', 1, 2, '2026-06-11 15:58:23', 17, ''),
(28, 6, 'Vegetable Pizza', 'Peppers, mushrooms, onion, olives, and mozzarella', 12.99, '/images/menu/28.jpg', 1, 18, '2026-06-11 15:58:23', 16, 'vegetarian'),
(29, 7, 'Grilled Salmon', 'Salmon fillet with lemon butter and vegetables', 21.99, '/images/menu/29.jpg', 1, 12, '2026-06-11 15:58:23', 20, 'gluten-free'),
(30, 7, 'Shrimp Linguine', 'Linguine pasta with shrimp, garlic, and tomato sauce', 18.99, '/images/menu/30.jpg', 1, 16, '2026-06-11 15:58:23', 18, ''),
(31, 7, 'Sea Bass Plate', 'Pan-seared sea bass with herb potatoes', 23.50, '/images/menu/31.jpg', 1, 8, '2026-06-11 15:58:23', 22, 'gluten-free'),
(32, 7, 'Calamari', 'Crispy calamari with lemon aioli', 12.75, '/images/menu/32.jpg', 1, 20, '2026-06-11 15:58:23', 12, ''),
(33, 8, 'Chicken Quinoa Bowl', 'Quinoa, grilled chicken, avocado, greens, and tahini dressing', 14.50, '/images/menu/33.jpg', 1, 24, '2026-06-11 15:58:23', 12, 'gluten-free'),
(34, 8, 'Falafel Bowl', 'Falafel, hummus, salad, pickles, and tahini sauce', 12.50, '/images/menu/34.jpg', 1, 28, '2026-06-11 15:58:23', 12, 'vegan'),
(35, 8, 'Greek Salad Bowl', 'Feta, cucumber, tomato, olives, onion, and oregano dressing', 10.50, '/images/menu/35.jpg', 1, 22, '2026-06-11 15:58:23', 8, 'vegetarian,gluten-free'),
(36, 8, 'Vegan Power Bowl', 'Roasted vegetables, lentils, greens, and lemon dressing', 13.50, '/images/menu/36.jpg', 1, 19, '2026-06-11 15:58:23', 12, 'vegan,gluten-free'),
(37, 3, 'Mint Lemonade', 'Fresh lemon, mint, and crushed ice', 4.25, '/images/menu/37.jpg', 1, 35, '2026-06-11 15:58:23', 4, 'vegan'),
(38, 3, 'Turkish Coffee', 'Traditional strong coffee served in a small cup', 3.75, '/images/menu/38.jpg', 1, 30, '2026-06-11 15:58:23', 5, 'vegan'),
(39, 4, 'Baklava', 'Layered pastry with pistachio and syrup', 6.50, '/images/menu/39.jpg', 1, 22, '2026-06-11 15:58:23', 4, 'vegetarian'),
(40, 4, 'Fruit Plate', 'Seasonal sliced fruit', 6.00, '/images/menu/40.jpg', 1, 18, '2026-06-11 15:58:23', 5, 'vegan,gluten-free');

-- --------------------------------------------------------

--
-- Table structure for table `menu_item_modifiers`
--

CREATE TABLE `menu_item_modifiers` (
  `id` int(11) NOT NULL,
  `menu_item_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price_delta` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_item_modifiers`
--

INSERT INTO `menu_item_modifiers` (`id`, `menu_item_id`, `name`, `price_delta`, `created_at`) VALUES
(1, 25, 'Extra Mozzarella', 1.50, '2026-06-11 15:58:23'),
(2, 26, 'Extra Pepperoni', 2.00, '2026-06-11 15:58:23'),
(3, 6, 'Add Mushroom Sauce', 1.25, '2026-06-11 15:58:23'),
(4, 8, 'Extra Parmesan', 1.00, '2026-06-11 15:58:23'),
(5, 14, 'Oat Milk', 0.75, '2026-06-11 15:58:23'),
(6, 33, 'Extra Avocado', 1.50, '2026-06-11 15:58:23'),
(7, 34, 'Extra Falafel', 2.00, '2026-06-11 15:58:23'),
(8, 29, 'Extra Vegetables', 1.75, '2026-06-11 15:58:23');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `table_id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `status` enum('pending','confirmed','preparing','ready','served','completed','cancelled') DEFAULT 'pending',
  `total` decimal(10,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `promo_code_id` int(11) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `payment_type` enum('online','physical') DEFAULT 'online',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `estimated_ready_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `table_id`, `session_id`, `customer_id`, `status`, `total`, `notes`, `promo_code_id`, `discount_amount`, `payment_type`, `created_at`, `updated_at`, `estimated_ready_at`) VALUES
(1, 1, 1, NULL, 'completed', 10.99, NULL, NULL, 0.00, 'physical', '2026-06-10 03:15:37', '2026-06-10 03:32:45', NULL),
(5, 1, 3, NULL, 'completed', 8.99, NULL, NULL, 0.00, 'physical', '2026-06-10 13:39:25', '2026-06-10 14:39:49', NULL),
(6, 2, 4, NULL, 'completed', 10.99, NULL, NULL, 0.00, 'physical', '2026-06-10 14:40:10', '2026-06-10 15:00:50', NULL),
(7, 1, 3, NULL, 'completed', 23.97, NULL, NULL, 0.00, 'physical', '2026-06-10 14:50:53', '2026-06-10 15:00:51', NULL),
(8, 1, 3, NULL, 'completed', 23.97, NULL, NULL, 0.00, 'physical', '2026-06-10 14:57:59', '2026-06-10 15:00:51', NULL),
(9, 1, 3, NULL, 'completed', 23.97, NULL, NULL, 0.00, 'physical', '2026-06-10 14:58:37', '2026-06-10 15:00:52', NULL),
(10, 2, 4, NULL, 'completed', 10.99, NULL, NULL, 0.00, 'online', '2026-06-10 14:59:49', '2026-06-10 15:00:52', NULL),
(11, 2, 4, NULL, 'completed', 13.98, NULL, NULL, 0.00, 'online', '2026-06-10 15:02:14', '2026-06-11 18:20:58', NULL),
(12, 2, 4, NULL, 'completed', 8.99, NULL, NULL, 0.00, 'physical', '2026-06-10 15:28:54', '2026-06-11 18:20:59', NULL),
(13, 2, 4, NULL, 'completed', 8.99, NULL, NULL, 0.00, 'physical', '2026-06-10 15:30:46', '2026-06-10 15:39:23', NULL),
(15, 3, 5, NULL, 'completed', 8.99, NULL, NULL, 0.00, 'physical', '2026-06-10 15:58:59', '2026-06-10 15:58:59', NULL),
(16, 4, 6, NULL, 'completed', 8.99, NULL, NULL, 0.00, 'physical', '2026-06-10 16:01:36', '2026-06-10 16:01:42', NULL),
(17, 2, 4, NULL, 'completed', 8.99, NULL, NULL, 0.00, 'physical', '2026-06-10 16:35:25', '2026-06-11 18:20:59', NULL),
(19, 2, 4, NULL, 'completed', 10.99, NULL, NULL, 0.00, 'physical', '2026-06-10 16:59:35', '2026-06-11 18:21:00', NULL),
(21, 1, 3, NULL, 'completed', 0.09, NULL, NULL, 8.90, 'physical', '2026-06-10 22:26:00', '2026-06-11 18:22:15', NULL),
(31, 8, 8, 1, 'completed', 18.98, NULL, NULL, 0.00, 'online', '2026-06-11 13:49:29', '2026-06-11 13:51:24', '2026-06-11 14:04:29'),
(37, 2, 4, 1, 'completed', 16.98, NULL, NULL, 0.00, 'online', '2026-06-11 15:46:59', '2026-06-11 18:21:01', '2026-06-11 16:01:59'),
(45, 1, 3, 1, 'completed', 17.98, NULL, 1, 2.00, 'online', '2026-06-11 17:34:07', '2026-06-11 17:40:43', '2026-06-11 17:49:07'),
(48, 2, 4, 14, 'completed', 28.97, NULL, NULL, 0.00, 'physical', '2026-06-11 18:14:43', '2026-06-11 18:21:03', '2026-06-11 18:29:43'),
(51, 1, 3, 14, 'completed', 19.37, NULL, 1, 4.37, 'physical', '2026-06-11 18:50:05', '2026-06-11 18:54:34', '2026-06-11 19:10:05'),
(55, 1, 16, 14, 'cancelled', 10.99, NULL, NULL, 0.00, 'online', '2026-06-12 01:05:05', '2026-06-12 01:05:17', '2026-06-12 01:20:05');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `menu_item_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `notes` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','preparing','ready','served') DEFAULT 'pending',
  `modifiers` text DEFAULT NULL,
  `modifier_total` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `menu_item_id`, `quantity`, `notes`, `price`, `created_at`, `status`, `modifiers`, `modifier_total`) VALUES
(1, 1, 2, 1, NULL, 10.99, '2026-06-10 03:15:37', 'pending', NULL, 0.00),
(5, 5, 1, 1, NULL, 8.99, '2026-06-10 13:39:25', 'pending', NULL, 0.00),
(6, 6, 2, 1, NULL, 10.99, '2026-06-10 14:40:10', 'pending', NULL, 0.00),
(7, 7, 1, 2, NULL, 8.99, '2026-06-10 14:50:53', 'pending', NULL, 0.00),
(8, 7, 3, 1, NULL, 5.99, '2026-06-10 14:50:53', 'pending', NULL, 0.00),
(9, 8, 1, 2, NULL, 8.99, '2026-06-10 14:57:59', 'pending', NULL, 0.00),
(10, 8, 3, 1, NULL, 5.99, '2026-06-10 14:57:59', 'pending', NULL, 0.00),
(11, 9, 1, 2, NULL, 8.99, '2026-06-10 14:58:37', 'pending', NULL, 0.00),
(12, 9, 3, 1, NULL, 5.99, '2026-06-10 14:58:37', 'pending', NULL, 0.00),
(13, 10, 2, 1, NULL, 10.99, '2026-06-10 14:59:49', 'pending', NULL, 0.00),
(14, 11, 4, 2, NULL, 6.99, '2026-06-10 15:02:14', 'served', NULL, 0.00),
(15, 12, 1, 1, NULL, 8.99, '2026-06-10 15:28:54', 'served', NULL, 0.00),
(16, 13, 1, 1, NULL, 8.99, '2026-06-10 15:30:46', 'pending', NULL, 0.00),
(18, 15, 1, 1, NULL, 8.99, '2026-06-10 15:58:59', 'pending', NULL, 0.00),
(19, 16, 1, 1, NULL, 8.99, '2026-06-10 16:01:36', 'pending', NULL, 0.00),
(20, 17, 1, 1, NULL, 8.99, '2026-06-10 16:35:25', 'served', NULL, 0.00),
(23, 19, 2, 1, NULL, 10.99, '2026-06-10 16:59:35', 'served', NULL, 0.00),
(25, 21, 1, 1, NULL, 8.99, '2026-06-10 22:26:00', 'served', NULL, 0.00),
(38, 31, 2, 1, NULL, 10.99, '2026-06-11 13:49:29', 'served', NULL, 0.00),
(39, 31, 5, 1, NULL, 7.99, '2026-06-11 13:49:29', 'served', NULL, 0.00),
(45, 37, 2, 1, NULL, 10.99, '2026-06-11 15:46:59', 'served', NULL, 0.00),
(46, 37, 3, 1, NULL, 5.99, '2026-06-11 15:46:59', 'served', NULL, 0.00),
(55, 45, 1, 1, NULL, 8.99, '2026-06-11 17:34:07', 'served', NULL, 0.00),
(56, 45, 2, 1, NULL, 10.99, '2026-06-11 17:34:07', 'served', NULL, 0.00),
(59, 48, 1, 2, NULL, 8.99, '2026-06-11 18:14:43', 'served', NULL, 0.00),
(60, 48, 2, 1, NULL, 10.99, '2026-06-11 18:14:43', 'served', NULL, 0.00),
(64, 51, 29, 1, NULL, 21.99, '2026-06-11 18:50:05', 'served', '[{\"id\":8,\"name\":\"Extra Vegetables\",\"price_delta\":1.75}]', 1.75),
(68, 55, 2, 1, NULL, 10.99, '2026-06-12 01:05:05', 'pending', NULL, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `order_status_history`
--

CREATE TABLE `order_status_history` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_status_history`
--

INSERT INTO `order_status_history` (`id`, `order_id`, `status`, `changed_at`) VALUES
(1, 1, 'pending', '2026-06-10 03:15:37'),
(9, 5, 'pending', '2026-06-10 13:39:25'),
(10, 5, 'confirmed', '2026-06-10 13:39:25'),
(11, 5, 'preparing', '2026-06-10 13:45:10'),
(12, 5, 'ready', '2026-06-10 13:45:10'),
(15, 5, 'served', '2026-06-10 14:39:48'),
(16, 5, 'completed', '2026-06-10 14:39:49'),
(17, 6, 'pending', '2026-06-10 14:40:10'),
(18, 6, 'confirmed', '2026-06-10 14:40:10'),
(19, 7, 'pending', '2026-06-10 14:50:53'),
(20, 7, 'confirmed', '2026-06-10 14:50:53'),
(21, 8, 'pending', '2026-06-10 14:57:59'),
(22, 8, 'confirmed', '2026-06-10 14:57:59'),
(23, 9, 'pending', '2026-06-10 14:58:37'),
(24, 9, 'confirmed', '2026-06-10 14:58:37'),
(25, 10, 'pending', '2026-06-10 14:59:49'),
(26, 10, 'confirmed', '2026-06-10 14:59:49'),
(27, 6, 'preparing', '2026-06-10 15:00:30'),
(28, 7, 'preparing', '2026-06-10 15:00:31'),
(29, 8, 'preparing', '2026-06-10 15:00:31'),
(30, 9, 'preparing', '2026-06-10 15:00:32'),
(31, 10, 'preparing', '2026-06-10 15:00:33'),
(32, 6, 'ready', '2026-06-10 15:00:33'),
(33, 7, 'ready', '2026-06-10 15:00:34'),
(34, 8, 'ready', '2026-06-10 15:00:34'),
(35, 9, 'ready', '2026-06-10 15:00:34'),
(36, 10, 'ready', '2026-06-10 15:00:35'),
(37, 6, 'served', '2026-06-10 15:00:48'),
(38, 7, 'served', '2026-06-10 15:00:48'),
(39, 8, 'served', '2026-06-10 15:00:49'),
(40, 9, 'served', '2026-06-10 15:00:49'),
(41, 10, 'served', '2026-06-10 15:00:49'),
(42, 6, 'completed', '2026-06-10 15:00:50'),
(43, 7, 'completed', '2026-06-10 15:00:51'),
(44, 8, 'completed', '2026-06-10 15:00:51'),
(45, 9, 'completed', '2026-06-10 15:00:52'),
(46, 10, 'completed', '2026-06-10 15:00:52'),
(47, 11, 'pending', '2026-06-10 15:02:14'),
(48, 11, 'confirmed', '2026-06-10 15:02:14'),
(49, 12, 'pending', '2026-06-10 15:28:54'),
(50, 12, 'confirmed', '2026-06-10 15:28:54'),
(51, 13, 'pending', '2026-06-10 15:30:46'),
(52, 13, 'confirmed', '2026-06-10 15:30:46'),
(53, 13, 'preparing', '2026-06-10 15:30:46'),
(54, 13, 'ready', '2026-06-10 15:30:46'),
(55, 13, 'served', '2026-06-10 15:30:46'),
(56, 13, 'completed', '2026-06-10 15:39:23'),
(60, 15, 'pending', '2026-06-10 15:58:59'),
(61, 15, 'confirmed', '2026-06-10 15:58:59'),
(62, 15, 'preparing', '2026-06-10 15:58:59'),
(63, 15, 'ready', '2026-06-10 15:58:59'),
(64, 15, 'served', '2026-06-10 15:58:59'),
(65, 15, 'completed', '2026-06-10 15:58:59'),
(66, 16, 'pending', '2026-06-10 16:01:36'),
(67, 16, 'confirmed', '2026-06-10 16:01:36'),
(68, 16, 'preparing', '2026-06-10 16:01:36'),
(69, 16, 'ready', '2026-06-10 16:01:36'),
(70, 16, 'served', '2026-06-10 16:01:36'),
(71, 16, 'completed', '2026-06-10 16:01:42'),
(72, 17, 'pending', '2026-06-10 16:35:25'),
(73, 17, 'confirmed', '2026-06-10 16:35:25'),
(76, 19, 'pending', '2026-06-10 16:59:35'),
(77, 19, 'confirmed', '2026-06-10 16:59:35'),
(80, 21, 'pending', '2026-06-10 22:26:00'),
(81, 21, 'confirmed', '2026-06-10 22:26:00'),
(99, 31, 'pending', '2026-06-11 13:49:29'),
(100, 31, 'confirmed', '2026-06-11 13:49:29'),
(101, 31, 'preparing', '2026-06-11 13:49:55'),
(102, 31, 'ready', '2026-06-11 13:50:09'),
(103, 31, 'served', '2026-06-11 13:51:22'),
(104, 31, 'completed', '2026-06-11 13:51:24'),
(107, 11, 'preparing', '2026-06-11 13:59:32'),
(108, 12, 'preparing', '2026-06-11 13:59:34'),
(109, 17, 'preparing', '2026-06-11 13:59:35'),
(111, 19, 'preparing', '2026-06-11 13:59:35'),
(113, 21, 'preparing', '2026-06-11 13:59:36'),
(115, 11, 'ready', '2026-06-11 13:59:36'),
(116, 12, 'ready', '2026-06-11 13:59:36'),
(117, 17, 'ready', '2026-06-11 13:59:37'),
(119, 19, 'ready', '2026-06-11 13:59:45'),
(121, 21, 'ready', '2026-06-11 14:00:05'),
(130, 37, 'pending', '2026-06-11 15:46:59'),
(131, 37, 'confirmed', '2026-06-11 15:46:59'),
(132, 37, 'preparing', '2026-06-11 16:06:08'),
(133, 37, 'ready', '2026-06-11 16:06:09'),
(148, 21, 'served', '2026-06-11 17:18:03'),
(149, 45, 'pending', '2026-06-11 17:34:07'),
(150, 45, 'confirmed', '2026-06-11 17:34:07'),
(165, 45, 'preparing', '2026-06-11 17:37:37'),
(166, 45, 'ready', '2026-06-11 17:38:10'),
(173, 45, 'served', '2026-06-11 17:40:40'),
(174, 45, 'completed', '2026-06-11 17:40:43'),
(181, 48, 'pending', '2026-06-11 18:14:43'),
(182, 48, 'confirmed', '2026-06-11 18:14:43'),
(183, 48, 'preparing', '2026-06-11 18:17:18'),
(184, 48, 'ready', '2026-06-11 18:18:46'),
(185, 11, 'served', '2026-06-11 18:20:48'),
(186, 12, 'served', '2026-06-11 18:20:52'),
(187, 17, 'served', '2026-06-11 18:20:52'),
(188, 19, 'served', '2026-06-11 18:20:52'),
(189, 37, 'served', '2026-06-11 18:20:53'),
(190, 48, 'served', '2026-06-11 18:20:54'),
(191, 11, 'completed', '2026-06-11 18:20:58'),
(192, 12, 'completed', '2026-06-11 18:20:59'),
(193, 17, 'completed', '2026-06-11 18:21:00'),
(194, 19, 'completed', '2026-06-11 18:21:00'),
(195, 37, 'completed', '2026-06-11 18:21:01'),
(196, 48, 'completed', '2026-06-11 18:21:03'),
(197, 21, 'completed', '2026-06-11 18:22:15'),
(204, 51, 'pending', '2026-06-11 18:50:05'),
(205, 51, 'confirmed', '2026-06-11 18:50:05'),
(206, 51, 'preparing', '2026-06-11 18:53:13'),
(207, 51, 'ready', '2026-06-11 18:53:33'),
(208, 51, 'served', '2026-06-11 18:54:28'),
(209, 51, 'completed', '2026-06-11 18:54:34'),
(225, 55, 'pending', '2026-06-12 01:05:05'),
(226, 55, 'confirmed', '2026-06-12 01:05:05'),
(227, 55, 'cancelled', '2026-06-12 01:05:17');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('card','cash','mobile') DEFAULT 'card',
  `payment_timing` enum('pre','post') DEFAULT 'pre',
  `split_type` enum('full','equal','custom') DEFAULT 'full',
  `payer_name` varchar(100) DEFAULT NULL,
  `status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `transaction_id` varchar(100) DEFAULT NULL,
  `cashier_confirmed` tinyint(1) DEFAULT 0,
  `confirmed_by` int(11) DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `waiter_confirmed_by` int(11) DEFAULT NULL,
  `waiter_confirmed_at` timestamp NULL DEFAULT NULL,
  `tip_amount` decimal(10,2) DEFAULT 0.00,
  `refund_reason` varchar(255) DEFAULT NULL,
  `refunded_by` int(11) DEFAULT NULL,
  `refunded_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `amount`, `method`, `payment_timing`, `split_type`, `payer_name`, `status`, `transaction_id`, `cashier_confirmed`, `confirmed_by`, `confirmed_at`, `created_at`, `waiter_confirmed_by`, `waiter_confirmed_at`, `tip_amount`, `refund_reason`, `refunded_by`, `refunded_at`) VALUES
(1, 1, 10.99, 'card', 'post', 'full', NULL, 'paid', NULL, 1, NULL, '2026-06-10 16:54:08', '2026-06-10 03:15:37', NULL, NULL, 0.00, NULL, NULL, NULL),
(7, 5, 8.99, 'card', 'post', 'full', NULL, 'paid', 'TXN_1781098765650_XNSNYZ', 1, NULL, '2026-06-10 16:43:07', '2026-06-10 13:39:25', NULL, NULL, 0.00, NULL, NULL, NULL),
(8, 6, 10.99, 'cash', 'post', 'full', NULL, 'paid', 'TXN_1781102410938_M4L39Y', 1, NULL, '2026-06-10 16:43:05', '2026-06-10 14:40:10', NULL, NULL, 0.00, NULL, NULL, NULL),
(10, 7, 7.98, 'cash', 'pre', 'custom', 'You', 'paid', 'TXN_1781103053342_NRGDCC', 0, NULL, NULL, '2026-06-10 14:50:53', NULL, NULL, 0.00, NULL, NULL, NULL),
(11, 7, 7.98, 'cash', 'pre', 'custom', 'Alex', 'paid', 'TXN_1781103053343_VMITS0', 0, NULL, NULL, '2026-06-10 14:50:53', NULL, NULL, 0.00, NULL, NULL, NULL),
(12, 7, 8.01, 'cash', 'pre', 'custom', 'Person 3', 'paid', 'TXN_1781103053344_91UTPW', 0, NULL, NULL, '2026-06-10 14:50:53', NULL, NULL, 0.00, NULL, NULL, NULL),
(14, 8, 7.98, 'cash', 'post', 'custom', 'You', 'paid', 'TXN_1781103479471_6WYEG6', 1, NULL, '2026-06-10 16:43:11', '2026-06-10 14:57:59', NULL, NULL, 0.00, NULL, NULL, NULL),
(15, 8, 7.98, 'cash', 'post', 'custom', 'Alex', 'paid', 'TXN_1781103479472_8Z573H', 1, NULL, '2026-06-10 16:54:05', '2026-06-10 14:57:59', NULL, NULL, 0.00, NULL, NULL, NULL),
(16, 8, 8.01, 'cash', 'post', 'custom', 'Person 3', 'paid', 'TXN_1781103479474_LJMW35', 1, NULL, '2026-06-10 16:54:06', '2026-06-10 14:57:59', NULL, NULL, 0.00, NULL, NULL, NULL),
(18, 9, 7.98, 'cash', 'post', 'custom', 'You', 'paid', 'TXN_1781103517216_YA6MIA', 1, NULL, '2026-06-10 16:41:46', '2026-06-10 14:58:37', NULL, NULL, 0.00, NULL, NULL, NULL),
(19, 9, 7.98, 'cash', 'post', 'custom', 'Alex', 'paid', 'TXN_1781103517218_M5KK0X', 1, NULL, '2026-06-10 16:42:54', '2026-06-10 14:58:37', NULL, NULL, 0.00, NULL, NULL, NULL),
(20, 9, 8.01, 'cash', 'post', 'custom', 'Person 3', 'paid', 'TXN_1781103517219_QRWOQF', 1, NULL, '2026-06-10 16:43:09', '2026-06-10 14:58:37', NULL, NULL, 0.00, NULL, NULL, NULL),
(21, 10, 10.99, 'card', 'pre', 'full', NULL, 'paid', 'TXN_1781103589942_NZ49CO', 0, NULL, NULL, '2026-06-10 14:59:49', NULL, NULL, 0.00, NULL, NULL, NULL),
(22, 11, 13.98, 'card', 'pre', 'full', NULL, 'paid', 'TXN_1781103734442_27ZF4W', 0, NULL, NULL, '2026-06-10 15:02:14', NULL, NULL, 0.00, NULL, NULL, NULL),
(24, 12, 4.50, 'card', 'pre', 'custom', 'Sara (paid online)', 'paid', 'TXN_1781105334598_EQ69XI', 0, NULL, NULL, '2026-06-10 15:28:54', NULL, NULL, 0.00, NULL, NULL, NULL),
(25, 12, 4.49, 'cash', 'post', 'custom', 'You', 'paid', 'TXN_1781105334600_HWAP7F', 1, NULL, '2026-06-11 16:56:32', '2026-06-10 15:28:54', NULL, '2026-06-11 16:56:02', 0.00, NULL, NULL, NULL),
(27, 13, 4.50, 'card', 'pre', 'custom', 'Sara (paid online)', 'paid', 'TXN_1781105446189_CIOI18', 0, NULL, NULL, '2026-06-10 15:30:46', NULL, NULL, 0.00, NULL, NULL, NULL),
(28, 13, 4.49, 'cash', 'post', 'custom', 'You', 'paid', 'TXN_1781105446190_HVDPX2', 1, NULL, '2026-06-10 15:39:23', '2026-06-10 15:30:46', NULL, NULL, 0.00, NULL, NULL, NULL),
(32, 15, 8.99, 'cash', 'post', 'full', NULL, 'paid', 'TXN_1781107139556_BJLB00', 1, NULL, '2026-06-10 15:58:59', '2026-06-10 15:58:59', NULL, '2026-06-10 15:58:59', 0.00, NULL, NULL, NULL),
(33, 16, 8.99, 'cash', 'post', 'full', NULL, 'paid', 'TXN_1781107296708_4VBX6R', 1, NULL, '2026-06-10 16:01:42', '2026-06-10 16:01:36', NULL, '2026-06-10 16:01:39', 0.00, NULL, NULL, NULL),
(35, 17, 4.49, 'card', 'pre', 'custom', 'Sara', 'paid', 'TXN_1781109325645_8NLF4L', 0, NULL, NULL, '2026-06-10 16:35:25', NULL, NULL, 0.00, NULL, NULL, NULL),
(36, 17, 4.50, 'card', 'pre', 'custom', 'Omar', 'paid', 'TXN_1781109325647_Z5MJ6H', 0, NULL, NULL, '2026-06-10 16:35:25', NULL, NULL, 0.00, NULL, NULL, NULL),
(40, 19, 10.99, 'cash', 'pre', 'full', NULL, 'paid', 'TXN_1781110775790_4NA50S', 0, NULL, NULL, '2026-06-10 16:59:35', NULL, NULL, 0.00, NULL, NULL, NULL),
(42, 21, 0.09, 'card', 'post', 'full', NULL, 'paid', 'TXN_1781130360393_0VXBJA', 1, NULL, '2026-06-11 16:56:35', '2026-06-10 22:26:00', NULL, '2026-06-11 16:56:01', 0.00, NULL, NULL, NULL),
(52, 31, 18.98, 'card', 'pre', 'full', NULL, 'paid', 'TXN_1781185769576_J5GNHS', 0, NULL, NULL, '2026-06-11 13:49:29', NULL, NULL, 0.00, NULL, NULL, NULL),
(59, 37, 8.49, 'card', 'pre', 'custom', 'You', 'paid', 'TXN_1781192819600_MC8R1P', 0, NULL, NULL, '2026-06-11 15:46:59', NULL, NULL, 0.00, NULL, NULL, NULL),
(60, 37, 8.49, 'card', 'pre', 'custom', 'Person 2', 'paid', 'TXN_1781192819603_GFKACB', 0, NULL, NULL, '2026-06-11 15:46:59', NULL, NULL, 0.00, NULL, NULL, NULL),
(73, 45, 8.99, 'card', 'pre', 'custom', 'mahjoub', 'paid', 'TXN_1781199247079_0COPV1', 0, NULL, NULL, '2026-06-11 17:34:07', NULL, NULL, 0.00, NULL, NULL, NULL),
(74, 45, 8.99, 'card', 'pre', 'custom', 'Guest 2', 'paid', 'TXN_1781199247081_BN79XX', 0, NULL, NULL, '2026-06-11 17:34:07', NULL, NULL, 0.00, NULL, NULL, NULL),
(78, 48, 8.32, 'cash', 'post', 'custom', 'MAHJOUB', 'refunded', 'TXN_1781201683396_9WXJL3', 1, 18, '2026-06-11 18:26:35', '2026-06-11 18:14:43', 15, '2026-06-11 18:23:27', 1.08, 'other', 18, '2026-06-11 18:27:35'),
(79, 48, 8.32, 'cash', 'post', 'custom', 'Guest 2', 'paid', 'TXN_1781201683399_NZUME1', 1, 18, '2026-06-11 18:26:36', '2026-06-11 18:14:43', 15, '2026-06-11 18:23:30', 1.08, NULL, NULL, NULL),
(80, 48, 8.32, 'cash', 'post', 'custom', 'Guest 3', 'paid', 'TXN_1781201683401_ZRX97I', 1, 18, '2026-06-11 18:26:37', '2026-06-11 18:14:43', 15, '2026-06-11 18:23:31', 1.08, NULL, NULL, NULL),
(81, 48, 8.36, 'cash', 'post', 'custom', 'Guest 4', 'paid', 'TXN_1781201683403_7WU28I', 1, 18, '2026-06-11 18:26:38', '2026-06-11 18:14:43', 15, '2026-06-11 18:23:33', 1.11, NULL, NULL, NULL),
(85, 51, 4.84, 'cash', 'post', 'custom', 'MAHJOUB', 'refunded', 'TXN_1781203805468_2T6LF0', 1, 18, '2026-06-11 18:56:04', '2026-06-11 18:50:05', 15, '2026-06-11 18:55:04', 0.00, 'order_cancelled', 18, '2026-06-11 18:56:25'),
(86, 51, 4.84, 'cash', 'post', 'custom', 'Guest 2', 'paid', 'TXN_1781203805470_IC9CLD', 1, 18, '2026-06-11 18:56:05', '2026-06-11 18:50:05', 15, '2026-06-11 18:55:04', 0.00, NULL, NULL, NULL),
(87, 51, 4.84, 'cash', 'post', 'custom', 'Guest 3', 'paid', 'TXN_1781203805470_SIJZEZ', 1, 18, '2026-06-11 18:56:06', '2026-06-11 18:50:05', 15, '2026-06-11 18:55:05', 0.00, NULL, NULL, NULL),
(88, 51, 4.85, 'cash', 'post', 'custom', 'Guest 4', 'paid', 'TXN_1781203805472_XK81MH', 1, 18, '2026-06-11 18:56:06', '2026-06-11 18:50:05', 15, '2026-06-11 18:55:06', 0.00, NULL, NULL, NULL),
(94, 55, 10.99, 'card', 'pre', 'full', 'MAHJOUB', 'refunded', 'TXN_1781226305787_EFU36F', 0, NULL, NULL, '2026-06-12 01:05:05', NULL, NULL, 0.00, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `promo_codes`
--

CREATE TABLE `promo_codes` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `discount_type` enum('percent','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_order` decimal(10,2) DEFAULT 0.00,
  `max_uses` int(11) DEFAULT 0,
  `used_count` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `expires_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `promo_codes`
--

INSERT INTO `promo_codes` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_order`, `max_uses`, `used_count`, `is_active`, `expires_at`, `created_at`) VALUES
(1, 'WELCOME10', 'Get 10% off your first order', 'percent', 10.00, 0.00, 0, 2, 1, '2026-12-31', '2026-06-10 03:15:21'),
(2, 'SAVE5', 'Flat $5 off orders over $30', 'fixed', 5.00, 30.00, 0, 0, 1, '2026-12-31', '2026-06-10 03:15:21'),
(3, 'VIP20', '20% off for loyal guests', 'percent', 20.00, 50.00, 100, 0, 1, '2026-12-31', '2026-06-10 03:15:21');

-- --------------------------------------------------------

--
-- Table structure for table `push_subscriptions`
--

CREATE TABLE `push_subscriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_id` int(11) DEFAULT NULL,
  `endpoint` varchar(500) NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth_key` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ratings`
--

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `menu_item_id` int(11) DEFAULT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ratings`
--

INSERT INTO `ratings` (`id`, `order_id`, `menu_item_id`, `rating`, `comment`, `created_at`) VALUES
(2, 10, NULL, 5, NULL, '2026-06-10 15:00:59'),
(3, 31, NULL, 5, NULL, '2026-06-11 13:51:39'),
(4, 51, NULL, 5, NULL, '2026-06-11 18:55:24');

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `table_id` int(11) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `customer_email` varchar(100) DEFAULT NULL,
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `guests` int(11) DEFAULT 2,
  `status` enum('pending','confirmed','cancelled','completed','no_show') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`id`, `user_id`, `table_id`, `customer_name`, `customer_phone`, `customer_email`, `reservation_date`, `reservation_time`, `guests`, `status`, `notes`, `created_at`) VALUES
(1, NULL, 2, 'Admin User', NULL, 'admin@smart.com', '2026-06-11', '20:58:00', 2, 'completed', NULL, '2026-06-10 16:57:36'),
(2, NULL, 6, 'Admin User', NULL, 'admin@smart.com', '2026-06-12', '19:55:00', 5, 'no_show', NULL, '2026-06-11 13:55:39'),
(3, NULL, 1, 'Cashier Staff', NULL, 'cashier@smart.com', '2026-06-24', '22:56:00', 4, 'completed', NULL, '2026-06-11 17:54:25'),
(4, NULL, 1, 'OSMAN', '567576567', 'osman@smart.com', '2026-06-11', '12:03:00', 2, 'no_show', NULL, '2026-06-11 19:01:47');

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_tables`
--

CREATE TABLE `restaurant_tables` (
  `id` int(11) NOT NULL,
  `table_number` int(11) NOT NULL,
  `capacity` int(11) DEFAULT 4,
  `status` enum('available','occupied','reserved') DEFAULT 'available',
  `qr_token` varchar(100) NOT NULL,
  `waiter_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant_tables`
--

INSERT INTO `restaurant_tables` (`id`, `table_number`, `capacity`, `status`, `qr_token`, `waiter_id`, `created_at`) VALUES
(1, 1, 4, 'available', 'table_1', 21, '2026-06-10 03:15:21'),
(2, 2, 4, 'available', 'table_2', 21, '2026-06-10 03:15:21'),
(3, 3, 4, 'available', 'table_3', 21, '2026-06-10 03:15:21'),
(4, 4, 4, 'available', 'table_4', 21, '2026-06-10 03:15:21'),
(5, 5, 4, 'available', 'table_5', 21, '2026-06-10 03:15:21'),
(6, 6, 6, 'available', 'table_6', NULL, '2026-06-10 03:15:21'),
(7, 7, 6, 'available', 'table_7', NULL, '2026-06-10 03:15:21'),
(8, 8, 6, 'available', 'table_8', 15, '2026-06-10 03:15:21'),
(9, 9, 6, 'available', 'table_9', NULL, '2026-06-10 03:15:21'),
(10, 10, 6, 'available', 'table_10', NULL, '2026-06-10 03:15:21'),
(12, 11, 4, 'available', 'table_11', NULL, '2026-06-10 12:59:43'),
(13, 32, 4, 'available', 'table_32', NULL, '2026-06-11 15:41:31'),
(24, 12, 4, 'available', 'table_12', NULL, '2026-06-11 18:39:50'),
(25, 13, -1, 'available', 'table_13', NULL, '2026-06-11 19:07:34'),
(36, 35, 4, 'available', 'table_35', NULL, '2026-06-14 17:03:22');

-- --------------------------------------------------------

--
-- Table structure for table `security_events`
--

CREATE TABLE `security_events` (
  `id` int(11) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `path` varchar(255) DEFAULT NULL,
  `method` varchar(10) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `security_events`
--

INSERT INTO `security_events` (`id`, `event_type`, `ip_address`, `email`, `user_id`, `path`, `method`, `details`, `created_at`) VALUES
(11, 'failed_login', '127.0.0.1', 'kitchen@smart.com', NULL, '/api/auth/login', 'POST', '{\"reason\":\"unknown_email\"}', '2026-06-12 00:50:45'),
(12, 'invalid_token', '127.0.0.1', NULL, NULL, '/api/admin/security/blocked-ips', 'GET', '{\"reason\":\"jwt malformed\"}', '2026-06-12 22:15:59'),
(13, 'invalid_token', '127.0.0.1', NULL, NULL, '/api/admin/security/block-ip', 'POST', '{\"reason\":\"jwt malformed\"}', '2026-06-12 22:15:59'),
(14, 'invalid_token', '127.0.0.1', NULL, NULL, '/api/admin/security/blocked-ips', 'GET', '{\"reason\":\"jwt malformed\"}', '2026-06-12 22:15:59'),
(15, 'invalid_token', '127.0.0.1', NULL, NULL, '/api/admin/security/blocked-ips/203.0.113.5', 'DELETE', '{\"reason\":\"jwt malformed\"}', '2026-06-12 22:15:59'),
(16, 'invalid_token', '127.0.0.1', NULL, NULL, '/api/admin/security/blocked-ips', 'GET', '{\"reason\":\"jwt malformed\"}', '2026-06-12 22:15:59'),
(17, 'blocked_ip_attempt', '127.0.0.1', NULL, NULL, '/api/menu/categories', 'GET', '{\"ip\":\"127.0.0.1\"}', '2026-06-12 22:16:34'),
(18, 'blocked_ip_attempt', '127.0.0.1', NULL, NULL, '/api/auth/login', 'POST', '{\"ip\":\"127.0.0.1\"}', '2026-06-12 22:16:34'),
(19, 'blocked_ip_attempt', '127.0.0.1', NULL, NULL, '/api/admin/security/block-ip', 'POST', '{\"ip\":\"127.0.0.1\"}', '2026-06-12 22:17:22'),
(20, 'blocked_ip_attempt', '127.0.0.1', NULL, NULL, '/api/admin/security/blocked-ips', 'GET', '{\"ip\":\"127.0.0.1\"}', '2026-06-12 22:17:22'),
(21, 'blocked_ip_attempt', '127.0.0.1', NULL, NULL, '/api/admin/security/blocked-ips/198.51.100.7', 'DELETE', '{\"ip\":\"127.0.0.1\"}', '2026-06-12 22:17:22'),
(22, 'failed_login', '127.0.0.1', 'kitchen@smart.com', NULL, '/api/auth/login', 'POST', '{\"reason\":\"unknown_email\"}', '2026-06-13 00:37:30'),
(23, 'invalid_token', '127.0.0.1', NULL, NULL, '/api/kitchen/orders/history', 'GET', '{\"reason\":\"jwt malformed\"}', '2026-06-13 00:37:30'),
(24, 'invalid_token', '127.0.0.1', NULL, NULL, '/api/kitchen/orders/by-date?date=2026-06-13', 'GET', '{\"reason\":\"jwt malformed\"}', '2026-06-13 00:37:30'),
(25, 'failed_login', '127.0.0.1', 'kitchen@smart.com', NULL, '/api/auth/login', 'POST', '{\"reason\":\"unknown_email\"}', '2026-06-13 00:37:36'),
(26, 'failed_login', '127.0.0.1', 'aliaky@gmail.com', NULL, '/api/auth/login', 'POST', '{\"reason\":\"unknown_email\"}', '2026-06-14 16:52:03');

-- --------------------------------------------------------

--
-- Table structure for table `shifts`
--

CREATE TABLE `shifts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `clock_in` timestamp NOT NULL DEFAULT current_timestamp(),
  `clock_out` timestamp NULL DEFAULT NULL,
  `note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shifts`
--

INSERT INTO `shifts` (`id`, `user_id`, `clock_in`, `clock_out`, `note`) VALUES
(14, 1, '2026-06-11 16:07:14', '2026-06-11 16:07:16', NULL),
(19, 14, '2026-06-11 18:18:15', NULL, NULL),
(20, 16, '2026-06-11 18:18:59', NULL, NULL),
(21, 15, '2026-06-11 18:20:35', '2026-06-12 01:06:07', NULL),
(22, 18, '2026-06-11 18:27:58', '2026-06-11 18:33:43', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `table_sessions`
--

CREATE TABLE `table_sessions` (
  `id` int(11) NOT NULL,
  `table_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `status` enum('active','closed') DEFAULT 'active',
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ended_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `table_sessions`
--

INSERT INTO `table_sessions` (`id`, `table_id`, `session_token`, `status`, `started_at`, `ended_at`) VALUES
(1, 1, 'session_1_1781061337321', 'closed', '2026-06-10 03:15:37', '2026-06-10 12:57:00'),
(2, 7, 'session_7_1781061565857', 'closed', '2026-06-10 03:19:25', '2026-06-12 00:35:36'),
(3, 1, 'session_1_1781098765622', 'closed', '2026-06-10 13:39:25', '2026-06-12 00:35:36'),
(4, 2, 'session_2_1781102410918', 'closed', '2026-06-10 14:40:10', '2026-06-11 18:23:43'),
(5, 3, 'session_3_1781107139543', 'closed', '2026-06-10 15:58:59', '2026-06-11 16:05:17'),
(6, 4, 'session_4_1781107296685', 'closed', '2026-06-10 16:01:36', '2026-06-11 16:05:18'),
(7, 9, 'session_9_1781110485730', 'closed', '2026-06-10 16:54:45', '2026-06-12 00:35:36'),
(8, 8, 'session_8_1781185769540', 'closed', '2026-06-11 13:49:29', '2026-06-11 16:05:19'),
(9, 12, 'session_12_1781185942170', 'closed', '2026-06-11 13:52:22', '2026-06-12 00:35:36'),
(10, 5, 'session_5_1781190654758', 'closed', '2026-06-11 15:10:54', '2026-06-12 00:35:36'),
(11, 4, 'session_4_1781194116961', 'closed', '2026-06-11 16:08:36', '2026-06-12 00:35:36'),
(12, 3, 'session_3_1781197057566', 'closed', '2026-06-11 16:57:37', '2026-06-12 00:35:36'),
(13, 10, 'session_10_1781198204466', 'closed', '2026-06-11 17:16:44', '2026-06-12 00:35:36'),
(14, 8, 'session_8_1781202428712', 'closed', '2026-06-11 18:27:08', '2026-06-12 00:35:36'),
(16, 1, 'session_1_1781226305775', 'closed', '2026-06-12 01:05:05', '2026-06-12 01:06:02');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','manager','waiter','kitchen','cashier','customer') DEFAULT 'customer',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `is_active`, `created_at`) VALUES
(1, 'Admin User', 'admin@smart.com', '$2b$10$LSrKv/0CIZ0Mfs4j6YrSeeHAQESafK/MgiPigFB4.LMZpH2eDZ3Y.', 'admin', 1, '2026-06-10 03:15:21'),
(14, 'MAHJOUB', 'mahjoub@gmail.com', '$2b$10$ak9oWCFjbpNWY0VX8TkZp.Qjv51C2./7qs2uDMlHDjdfchIYnMbry', 'customer', 1, '2026-06-11 18:07:10'),
(15, 'SAIF', 'saif@gmail.com', '$2b$10$/MT5qjfjLOQH7jP6o71bIeXcGzJOP8LBj6DY3OdzKBwHiS5tnWQfS', 'waiter', 1, '2026-06-11 18:07:39'),
(16, 'MALEK', 'malek@gmail.com', '$2b$10$nOpP0ni5Rdnn36OqjZEMX.xoFUK9aPy/bNVAoplmj2o5oLP67w5cS', 'kitchen', 1, '2026-06-11 18:07:59'),
(17, 'OSMAN', 'osman@smart.com', '$2b$10$XIHQibxmmLV2nWxgVJjz0OmgpbI2ForRVi9hOsi6TOBQY2X90ilrm', 'manager', 1, '2026-06-11 18:08:18'),
(18, 'saifcash', 'saifcash@gmail.com', '$2b$10$A5eXgpRxnzSC5a/9mFlJZeJHuNuBxs91dHyYSZgRlvDyCPxERwFLG', 'cashier', 1, '2026-06-11 18:09:06'),
(19, 'Manager User', 'manager@smart.com', '$2b$10$/mYn7tfFzyhmUeWVuoQCSeAnnoS4RzZAO42ySfyotANiVE.6t9.ki', 'manager', 1, '2026-06-14 16:16:35'),
(20, 'Kitchen Staff', 'kitchen@smart.com', '$2b$10$/mYn7tfFzyhmUeWVuoQCSeAnnoS4RzZAO42ySfyotANiVE.6t9.ki', 'kitchen', 1, '2026-06-14 16:16:35'),
(21, 'Waiter Staff', 'waiter@smart.com', '$2b$10$/mYn7tfFzyhmUeWVuoQCSeAnnoS4RzZAO42ySfyotANiVE.6t9.ki', 'waiter', 1, '2026-06-14 16:16:35'),
(22, 'Cashier Staff', 'cashier@smart.com', '$2b$10$/mYn7tfFzyhmUeWVuoQCSeAnnoS4RzZAO42ySfyotANiVE.6t9.ki', 'cashier', 1, '2026-06-14 16:16:35'),
(24, 'ali', 'aliaky@gmail.com', '$2b$10$hTVlSVbkQdMDCDF1Ls/ESO19gp96oyzlvOx9e71gz5gkkKSlNkhQW', 'customer', 1, '2026-06-14 16:52:11');

-- --------------------------------------------------------

--
-- Table structure for table `waiter_requests`
--

CREATE TABLE `waiter_requests` (
  `id` int(11) NOT NULL,
  `table_id` int(11) NOT NULL,
  `type` enum('help','water','salt','cleaning','complaint','bill') NOT NULL,
  `status` enum('pending','handled') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `waiter_requests`
--

INSERT INTO `waiter_requests` (`id`, `table_id`, `type`, `status`, `notes`, `created_at`) VALUES
(1, 1, 'help', 'handled', NULL, '2026-06-10 03:15:37'),
(2, 1, 'cleaning', 'handled', NULL, '2026-06-10 03:21:47'),
(3, 1, 'cleaning', 'handled', 'Guests finished - table needs cleaning', '2026-06-10 12:57:00'),
(4, 1, 'complaint', 'handled', NULL, '2026-06-10 13:39:54'),
(5, 8, 'water', 'handled', NULL, '2026-06-11 13:51:57'),
(6, 1, 'water', 'handled', NULL, '2026-06-11 17:35:40'),
(7, 8, 'cleaning', 'handled', NULL, '2026-06-11 18:21:10'),
(8, 1, 'help', 'handled', NULL, '2026-06-11 18:51:47'),
(9, 1, 'complaint', 'handled', NULL, '2026-06-11 18:52:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `blocked_ips`
--
ALTER TABLE `blocked_ips`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ip_address` (`ip_address`),
  ADD KEY `blocked_by` (`blocked_by`),
  ADD KEY `idx_blocked_ips_ip` (`ip_address`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `menu_item_id` (`menu_item_id`);

--
-- Indexes for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `loyalty_points`
--
ALTER TABLE `loyalty_points`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `loyalty_rewards`
--
ALTER TABLE `loyalty_rewards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `menu_item_id` (`menu_item_id`);

--
-- Indexes for table `menu_categories`
--
ALTER TABLE `menu_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `menu_item_modifiers`
--
ALTER TABLE `menu_item_modifiers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `menu_item_id` (`menu_item_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `table_id` (`table_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `promo_code_id` (`promo_code_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `menu_item_id` (`menu_item_id`);

--
-- Indexes for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `confirmed_by` (`confirmed_by`),
  ADD KEY `waiter_confirmed_by` (`waiter_confirmed_by`);

--
-- Indexes for table `promo_codes`
--
ALTER TABLE `promo_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_endpoint` (`endpoint`(255));

--
-- Indexes for table `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `menu_item_id` (`menu_item_id`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `table_id` (`table_id`),
  ADD KEY `fk_reservations_user` (`user_id`);

--
-- Indexes for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `table_number` (`table_number`),
  ADD UNIQUE KEY `qr_token` (`qr_token`),
  ADD KEY `waiter_id` (`waiter_id`);

--
-- Indexes for table `security_events`
--
ALTER TABLE `security_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_security_events_created` (`created_at`),
  ADD KEY `idx_security_events_ip` (`ip_address`),
  ADD KEY `idx_security_events_type` (`event_type`);

--
-- Indexes for table `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `table_sessions`
--
ALTER TABLE `table_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `table_id` (`table_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `waiter_requests`
--
ALTER TABLE `waiter_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `table_id` (`table_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `blocked_ips`
--
ALTER TABLE `blocked_ips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `inventory_items`
--
ALTER TABLE `inventory_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `loyalty_points`
--
ALTER TABLE `loyalty_points`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `loyalty_rewards`
--
ALTER TABLE `loyalty_rewards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `menu_categories`
--
ALTER TABLE `menu_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `menu_item_modifiers`
--
ALTER TABLE `menu_item_modifiers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=228;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=95;

--
-- AUTO_INCREMENT for table `promo_codes`
--
ALTER TABLE `promo_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `security_events`
--
ALTER TABLE `security_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `table_sessions`
--
ALTER TABLE `table_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `waiter_requests`
--
ALTER TABLE `waiter_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `blocked_ips`
--
ALTER TABLE `blocked_ips`
  ADD CONSTRAINT `blocked_ips_ibfk_1` FOREIGN KEY (`blocked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `loyalty_points`
--
ALTER TABLE `loyalty_points`
  ADD CONSTRAINT `loyalty_points_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `loyalty_points_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `loyalty_rewards`
--
ALTER TABLE `loyalty_rewards`
  ADD CONSTRAINT `loyalty_rewards_ibfk_1` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `menu_item_modifiers`
--
ALTER TABLE `menu_item_modifiers`
  ADD CONSTRAINT `menu_item_modifiers_ibfk_1` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `table_sessions` (`id`),
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`);

--
-- Constraints for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`waiter_confirmed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`);

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `fk_reservations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  ADD CONSTRAINT `restaurant_tables_ibfk_1` FOREIGN KEY (`waiter_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `security_events`
--
ALTER TABLE `security_events`
  ADD CONSTRAINT `security_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `shifts`
--
ALTER TABLE `shifts`
  ADD CONSTRAINT `shifts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `table_sessions`
--
ALTER TABLE `table_sessions`
  ADD CONSTRAINT `table_sessions_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `waiter_requests`
--
ALTER TABLE `waiter_requests`
  ADD CONSTRAINT `waiter_requests_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
