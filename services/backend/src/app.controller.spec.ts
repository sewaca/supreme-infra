import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';

jest.mock('./features/HelloWorld/HelloWorld.module', () => ({
  HelloWorldModule: class HelloWorldModuleMock {},
}));

describe('AppController', () => {
  it('should correctly build up', async () => {
    const appModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    expect(appModule).toBeDefined();
  });
});
