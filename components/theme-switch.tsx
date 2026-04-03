"use client";

import {Label, Switch} from "@heroui/react";
import {useTheme} from "next-themes";
import {useSyncExternalStore} from "react";

const subscribe = () => () => {
};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsClient() {
    return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

export function ThemeSwitch() {
    const isClient = useIsClient();
    const {resolvedTheme, setTheme} = useTheme();

    if (!isClient) {
        return <div className="h-8 w-35" aria-hidden/>;
    }

    const isDark = resolvedTheme === "dark";

    return (
        <Switch
            isSelected={isDark}
            onChange={(selected) => setTheme(selected ? "dark" : "light")}
        >
            <Switch.Control>
                <Switch.Thumb/>
            </Switch.Control>
            <Switch.Content>
                <Label className="text-sm text-muted">Dark mode</Label>
            </Switch.Content>
        </Switch>
    );
}
