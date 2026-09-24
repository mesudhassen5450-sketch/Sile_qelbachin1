// Config Imports
import themeConfig from '@/configs/themeConfig'

// SVG Imports
import LogoSvg from '@/assets/svg/logo'

// Util Imports
import { cn } from '@/lib/utils'

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoSvg className='size-8.5' />
      <div className='flex flex-col leading-tight'>
        <span className='text-base font-bold'>{themeConfig.templateNameAmharic}</span>
        <span className='text-muted-foreground text-xs'>{themeConfig.templateName}</span>
      </div>
    </div>
  )
}

export default Logo
