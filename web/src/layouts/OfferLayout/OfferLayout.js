import { Transition } from '@headlessui/react'
import { useState, useEffect } from 'react'

const OfferLayout = (props) => {
    let [isShowing, setIsShowing] = useState(false)
    useEffect(() => {
    // Update the transition state after component mounting
        setIsShowing(true)
    });

    const imageUrl = "https://ik.imagekit.io/dttv/SHOOTING/DETRI_211202_436__25PSAfEv.jpg?ik-sdk-version=javascript-1.4.3&updatedAt=1651843531520"    
    
    return (
        <div className="p-6 bg-gray-300 bg-cover bg-no-repeat bg-center" style={{ backgroundImage: `url(${imageUrl})` }}>
            <Transition
                appear={true}
                show={isShowing}
                enter="transition-opacity duration-[1500ms] ease-in-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave=" transition-opacity duration-[1500ms] ease-in-out"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                {props.children}
            </Transition>
        </div>
    )
};
  
export default OfferLayout
  