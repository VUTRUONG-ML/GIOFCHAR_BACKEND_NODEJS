-- Seed Data for Development Environment

-- Seed Admin and User
INSERT IGNORE INTO `users` (`id`, `userName`, `email`, `phone`, `address`, `password`, `role`, `isActive`) VALUES
(1, 'Admin System', 'admin@giofchar.com', '0900000001', 'Ho Chi Minh City', '$2b$10$l2qtyJjuk9fzI/taOEulUe..rc7qdm1moB6woTZj9cUDTD4xL6qTm', 'admin', 1),
(2, 'Dev Test User', 'user@giofchar.com', '0900000002', 'Ho Chi Minh City', '$2b$10$RkrqgQWtj1LHJPUq1bzPu.lMfo8nylKtYPmIDFd61K4hlG.WaQWyW', 'user', 1);

-- Seed Categories
INSERT IGNORE INTO `categories` (`id`, `categoryName`, `categoryDescription`) VALUES
(1, 'Giò chả truyền thống', 'Các sản phẩm giò chả chế biến theo công thức truyền thống.'),
(2, 'Xúc xích nhà làm', 'Xúc xích tươi làm từ thịt heo sạch, phô mai béo ngậy.'),
(3, 'Chả hải sản', 'Chả mực, chả tôm tươi ngon đặc sản vùng biển.'),
(4, 'Nem chua', 'Nem chua lá ổi chuẩn vị thanh cay.');

-- Seed Foods
INSERT IGNORE INTO `foods` (`id`, `foodName`, `foodDescription`, `ingredients`, `originalPrice`, `price`, `discount`, `rating`, `stock`, `isActive`, `categoryID`, `image`) VALUES
(1, 'Giò Lụa Thượng Hạng', 'Giò lụa làm từ thịt heo nóng dẻo gói lá chuối xanh mướt.', '["Thịt heo tươi", "Da heo", "Lá chuối"]', 200000.00, 160000.00, 20, 5, 100, 1, 1, 'https://res.cloudinary.com/dzpckiiv3/image/upload/v1772157427/GIOFCHAR_BACKEND_NODEJS_SQL/imageFood-1772157426041-474028761.jpg'),
(2, 'Chả Quế Nướng Mật Ong', 'Lớp vỏ vàng rộm thơm lừng mùi quế Trà My quyện mật ong.', '["Thịt heo tươi", "Mật ong", "Quế"]', 190000.00, 190000.00, 0, 5, 50, 1, 1, 'https://res.cloudinary.com/dzpckiiv3/image/upload/v1770776875/GIOFCHAR_BACKEND_NODEJS_SQL/imageFood-1770776869270-743578291.jpg'),
(3, 'Xúc Xích Tươi Phô Mai Mozzarella', 'Xúc xích tươi nhân phô mai kéo sợi thơm ngậy.', '["Thịt heo tươi", "Phô mai Mozzarella"]', 160000.00, 128000.00, 20, 5, 80, 1, 2, 'https://res.cloudinary.com/dzpckiiv3/image/upload/v1770777016/GIOFCHAR_BACKEND_NODEJS_SQL/imageFood-1770776988131-161165831.jpg'),
(4, 'Nem Chua Lá Ổi', 'Nem chua lên men tự nhiên gói kèm lá ổi bánh tẻ.', '["Thịt heo tươi", "Da heo", "Lá ổi", "Ớt", "Tỏi"]', 60000.00, 60000.00, 0, 5, 120, 1, 4, 'https://res.cloudinary.com/dzpckiiv3/image/upload/v1766378812/GIOFCHAR_BACKEND_NODEJS_SQL/imageFood-1766378802270-185296079.jpg');

-- Seed Food Variants
INSERT IGNORE INTO `food_variants` (`id`, `foodID`, `weight_gram`, `originalPrice`, `stock`, `isActive`) VALUES
(1, 1, 500, 100000, 50, 1),
(2, 1, 1000, 200000, 50, 1),
(3, 2, 500, 95000, 25, 1),
(4, 2, 1000, 190000, 25, 1),
(5, 3, 500, 80000, 40, 1),
(6, 4, 500, 60000, 60, 1);
