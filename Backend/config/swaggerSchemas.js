/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - plateNumber
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         plateNumber:
 *           type: string
 *           description: User's vehicle plate number
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           description: User's role in the system
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           default: pending
 *           description: User's account status
 *         isEmailVerified:
 *           type: boolean
 *           default: false
 *           description: Whether the user's email is verified
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was last updated
 * 
 *     Admin:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the admin
 *         name:
 *           type: string
 *           description: Admin's full name
 *         email:
 *           type: string
 *           format: email
 *           description: Admin's email address
 *         password:
 *           type: string
 *           format: password
 *           description: Admin's password
 *         isEmailVerified:
 *           type: boolean
 *           default: false
 *           description: Whether the admin's email is verified
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the admin was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the admin was last updated
 * 
 *     ParkingSlot:
 *       type: object
 *       required:
 *         - slotNumber
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the parking slot
 *         slotNumber:
 *           type: string
 *           description: Unique identifier for the parking slot
 *         status:
 *           type: string
 *           enum: [available, occupied, reserved]
 *           default: available
 *           description: Current status of the parking slot
 *         userId:
 *           type: integer
 *           description: ID of the user who has been assigned this slot
 *         assignedAt:
 *           type: string
 *           format: date-time
 *           description: When the slot was assigned to a user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the slot was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the slot was last updated
 * 
 *     Notification:
 *       type: object
 *       required:
 *         - type
 *         - message
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the notification
 *         userId:
 *           type: integer
 *           description: ID of the user who will receive the notification
 *         type:
 *           type: string
 *           description: Type of notification
 *         message:
 *           type: string
 *           description: Content of the notification
 *         isRead:
 *           type: boolean
 *           default: false
 *           description: Whether the notification has been read
 *         isSystem:
 *           type: boolean
 *           default: false
 *           description: Whether this is a system notification
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the notification was created
 * 
 *     OTP:
 *       type: object
 *       required:
 *         - email
 *         - code
 *         - type
 *         - role
 *         - expiresAt
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the OTP
 *         email:
 *           type: string
 *           format: email
 *           description: Email address the OTP was sent to
 *         code:
 *           type: string
 *           description: The OTP code
 *         type:
 *           type: string
 *           enum: [verification, reset]
 *           description: Type of OTP (verification or password reset)
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: Role of the user requesting the OTP
 *         isUsed:
 *           type: boolean
 *           default: false
 *           description: Whether the OTP has been used
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the OTP expires
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the OTP was created
 */ 