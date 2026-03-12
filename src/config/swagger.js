import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'SWP391 Project Management API',
      version: '1.0.0',
      description:
        'API Backend cho hệ thống quản lý yêu cầu và tiến độ dự án phần mềm SWP391 thông qua Jira & GitHub.\n\n' +
        '**Tính năng chính:**\n' +
        '- Xác thực (Email/Password + Google OAuth)\n' +
        '- Quản lý Nhóm & Thành viên\n' +
        '- Đồng bộ Jira Issues\n' +
        '- Đồng bộ GitHub Commits\n' +
        '- Báo cáo đóng góp cá nhân',
      contact: {
        name: 'SWD Team',
        email: 'longdevlife@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập token JWT lấy từ /api/auth/login hoặc /api/auth/register',
        },
      },
      schemas: {
        // ──────────── User ────────────
        UserResponse: {
          type: 'object',
          properties: {
            user_id: { type: 'integer', example: 1 },
            full_name: { type: 'string', example: 'Nguyễn Văn A' },
            email: { type: 'string', example: 'a@fpt.edu.vn' },
            roles: {
              type: 'array',
              items: { type: 'string' },
              example: ['MEMBER'],
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                user: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Invalid email or password' },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Server is running 🚀' },
            database: { type: 'string', example: 'Neon PostgreSQL ✅' },
            environment: { type: 'string', example: 'development' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Server health check' },
      { name: 'Auth', description: 'Xác thực & Đăng nhập (Email / Google OAuth)' },
      { name: 'Users', description: 'Quản lý người dùng' },
      { name: 'Groups', description: 'Quản lý nhóm sinh viên' },
      { name: 'Jira', description: 'Tích hợp Jira (Issues / Projects)' },
      { name: 'GitHub', description: 'Tích hợp GitHub (Repositories / Commits)' },
      { name: 'Reports', description: 'Báo cáo đóng góp' },
      { name: 'Sync', description: 'Đồng bộ thủ công & tự động (Jira + GitHub + Reports)' },
    ],
  },
  apis: ['./src/routes/*.js', './src/docs/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
