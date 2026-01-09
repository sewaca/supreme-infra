import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@supreme-int/nestjs-shared';
import { RecipeLikesService } from './RecipeLikes.service';

@Controller('recipes')
export class RecipeLikesController {
  constructor(private readonly recipeLikesService: RecipeLikesService) {}

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  public async toggleRecipeLike(
    @Param('id') id: string,
    @Request() req: { user: { id: number; email: string; name: string; role: string } },
  ): Promise<{ liked: boolean; totalLikes: number }> {
    const recipeId = Number.parseInt(id, 10);

    if (Number.isNaN(recipeId)) {
      throw new BadRequestException('Invalid recipe id parameter');
    }

    try {
      return await this.recipeLikesService.toggleRecipeLike(req.user.id, recipeId);
    } catch {
      throw new NotFoundException('Recipe not found');
    }
  }
}
