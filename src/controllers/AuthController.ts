import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { Logger } from '../types/Logger';

export class AuthController {
  constructor(private authService: AuthService, private logger: Logger) {}

  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      this.logger.info('Registering new user', { email });
      const user = await this.authService.register(name, email, password);
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      this.logger.error('Failed to register user', { error });
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      this.logger.info('User login attempt', { email });
      const token = await this.authService.login(email, password);
      res.json({ token });
    } catch (error) {
      this.logger.error('Failed to login', { error });
      res.status(401).json({ error: (error as Error).message });
    }
  }

  async userInfo(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }
      const user = await this.authService.getUserByToken(token);
      res.json(user);
    } catch (error) {
      this.logger.error('Failed to get user info', { error });
      res.status(401).json({ error: (error as Error).message });
    }
  }
}
