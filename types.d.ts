/**
 * Type Declarations File - Khai báo module cho TypeScript
 *
 * File này khai báo module "turndown-plugin-gfm" để TypeScript
 * có thể nhận diện và không báo lỗi khi import
 *
 * Lý do cần file này:
 * 1. "turndown-plugin-gfm" là một plugin cho thư viện turndown
 * 2. Nó không có sẵn type definitions trong @types
 * 3. Khai báo module này giúp TypeScript biết rằng module tồn tại
 * 4. Tránh lỗi "Cannot find module 'turndown-plugin-gfm' or its corresponding type declarations"
 *
 * Cú pháp "declare module" cho phép khai báo một module mà không cần import thực tế
 */
declare module "turndown-plugin-gfm";
