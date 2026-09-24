// Next Imports
import Link from 'next/link'

// Config Imports
import themeConfig from '@/configs/themeConfig'

const Footer = () => {
  return (
    <footer>
      <div className='text-muted-foreground mx-auto flex size-full max-w-360 items-center justify-between gap-3 px-4 py-3 max-sm:flex-col sm:gap-6 sm:px-6'>
        <p className='text-sm text-balance max-sm:text-center'>
          {`©${new Date().getFullYear()}`} {themeConfig.templateNameAmharic} · Local admin UI
        </p>
        <div className='flex items-center gap-5 max-sm:hidden'>
          <Link
            href={themeConfig.gatewayUrl}
            target='_blank'
            className='text-muted-foreground hover:text-foreground text-sm transition duration-300'
          >
            Gateway
          </Link>
          <Link
            href='/system/health'
            className='text-muted-foreground hover:text-foreground text-sm transition duration-300'
          >
            System Health
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
