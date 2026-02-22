cat > src/__tests__/middleware/authMiddleware.test.js << 'EOF'
const jwt = require('jsonwebtoken')
const verifyToken = require('../../middleware/authMiddleware')

// Asegurar variables de entorno para tests
process.env.ACCESS_TOKEN_SECRET = 'test-secret'

describe('Auth Middleware', () => {
    let req, res, next

    beforeEach(() => {
        req = {
            headers: {}
        }
        res = {
            sendStatus: jest.fn().mockReturnThis()
        }
        next = jest.fn()
    })

    test('debería llamar a next() si token es válido', () => {
        const token = jwt.sign(
            { id: '123', username: 'test' },
            process.env.ACCESS_TOKEN_SECRET
        )
        
        req.headers['authorization'] = `Bearer ${token}`
        
        verifyToken(req, res, next)
        
        expect(next).toHaveBeenCalled()
        expect(req.user).toBeDefined()
        expect(req.user.id).toBe('123')
        expect(req.user.username).toBe('test')
        expect(res.sendStatus).not.toHaveBeenCalled()
    })

    test('debería retornar 401 si no hay header de autorización', () => {
        verifyToken(req, res, next)
        
        expect(res.sendStatus).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    test('debería retornar 401 si header no tiene formato Bearer', () => {
        req.headers['authorization'] = 'InvalidFormat token'
        
        verifyToken(req, res, next)
        
        expect(res.sendStatus).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    test('debería retornar 401 si solo envía "Bearer" sin token', () => {
        req.headers['authorization'] = 'Bearer'
        
        verifyToken(req, res, next)
        
        expect(res.sendStatus).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    test('debería retornar 403 si token es inválido', () => {
        req.headers['authorization'] = 'Bearer invalid.token.here'
        
        verifyToken(req, res, next)
        
        expect(res.sendStatus).toHaveBeenCalledWith(403)
        expect(next).not.toHaveBeenCalled()
    })

    test('debería retornar 403 si token está expirado', () => {
        const token = jwt.sign(
            { id: '123', username: 'test' },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '0s' }
        )
        
        req.headers['authorization'] = `Bearer ${token}`
        
        verifyToken(req, res, next)
        
        expect(res.sendStatus).toHaveBeenCalledWith(403)
        expect(next).not.toHaveBeenCalled()
    })

    test('debería retornar 403 si token tiene firma incorrecta', () => {
        const token = jwt.sign(
            { id: '123', username: 'test' },
            'wrong-secret'
        )
        
        req.headers['authorization'] = `Bearer ${token}`
        
        verifyToken(req, res, next)
        
        expect(res.sendStatus).toHaveBeenCalledWith(403)
        expect(next).not.toHaveBeenCalled()
    })
})
EOF