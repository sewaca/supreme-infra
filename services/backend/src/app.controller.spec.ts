import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('AppController', () => {
  it('should correctly build up', async () => {
    const appModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    expect(appModule).toBeDefined();
  });
});
