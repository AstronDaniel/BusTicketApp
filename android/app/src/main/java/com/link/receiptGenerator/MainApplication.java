// ...existing imports...
import com.polidea.reactnativeble.BlePackage;

public class MainApplication extends Application implements ReactApplication {
    // ...existing code...
    @Override
    protected List<ReactPackage> getPackages() {
        List<ReactPackage> packages = new PackageList(this).getPackages();
        packages.add(new BlePackage());
        return packages;
    }
    // ...existing code...
}
