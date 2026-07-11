import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './api.controller';
import { AppService } from './app.service';

describe('ApiController', () => {
  let apiController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    apiController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(apiController.getHello()).toBe('Hello World!');
    });
  });
});
